const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../static/js/contact.js`, "utf8");
const endpoint = "https://contact.example.workers.dev/api/contact";
const email = "hello@example.com";

function load({ configured = true, preloaded = true, theme = "light", fetchImpl = () => Response.json({ email }) } = {}) {
    const elements = new Map();
    function element(tag = "div") {
        return {
            tag, children: [], handlers: {}, attributes: {}, hidden: false, disabled: false, textContent: "",
            append(child) { this.children.push(child); },
            replaceChildren(...children) { this.children = children; },
            addEventListener(event, callback) { this.handlers[event] = callback; },
            setAttribute(key, value) { this.attributes[key] = value; },
            focus() { this.focused = true; },
            remove() { this.removed = true; },
        };
    }
    for (const id of ["contact-toggle", "contact-info", "contact-status", "contact-challenge"]) elements.set(id, element());
    const button = elements.get("contact-toggle");
    button.hidden = true;
    const info = elements.get("contact-info");
    const status = elements.get("contact-status");
    const challenge = elements.get("contact-challenge");
    challenge.hidden = true;
    const head = element("head");
    const widgets = [];
    const removed = [];
    const calls = [];
    const timers = new Map();
    let timerId = 0;
    const api = {
        render(container, options) {
            assert.equal(container, challenge);
            widgets.push(options);
            return widgets.length - 1;
        },
        remove(id) { removed.push(id); },
    };
    const window = preloaded ? { turnstile: api } : {};
    vm.runInNewContext(source, {
        window,
        document: {
            currentScript: { dataset: { sitekey: "public-site-key", endpoint: configured ? endpoint : "" } },
            querySelector: () => element(),
            getElementById: id => elements.get(id),
            createElement: element,
            documentElement: { classList: { contains: value => value === theme } },
            head,
        },
        fetch: async (url, options) => { calls.push({ url, options }); return fetchImpl(); },
        AbortSignal,
        setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
        clearTimeout: id => timers.delete(id),
    });
    return {
        button, info, status, challenge, head, calls, widgets, removed, timers,
        click: () => button.handlers.click(),
        complete: token => widgets.at(-1).callback(token),
        loaded() { window.turnstile = api; window.onContactTurnstileLoad(); },
    };
}

test("loads Turnstile only after a click, with the public key and site theme", async () => {
    const page = load({ preloaded: false, theme: "dark" });
    assert.equal(page.head.children.length, 0);
    assert.equal(page.calls.length, 0);
    const clicked = page.click();
    const script = page.head.children[0];
    assert.equal(script.src, "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onContactTurnstileLoad");
    assert.equal(page.button.disabled, true);
    await page.click();
    assert.equal(page.head.children.length, 1);
    page.loaded();
    await clicked;
    assert.equal(page.widgets[0].sitekey, "public-site-key");
    assert.equal(page.widgets[0].action, "reveal-email");
    assert.equal(page.widgets[0].theme, "dark");
    assert.equal(page.info.children.length, 0);
    assert.equal(page.timers.size, 0);
});

test("waits for the server before revealing and focusing the email link", async () => {
    let resolve;
    const page = load({ fetchImpl: () => new Promise(done => { resolve = done; }) });
    await page.click();
    const completion = page.complete("challenge-token");
    await page.complete("duplicate-callback");
    assert.equal(page.info.children.length, 0);
    assert.equal(page.calls.length, 1);
    const { url, options } = page.calls[0];
    assert.equal(url, endpoint);
    assert.deepEqual(JSON.parse(options.body), { token: "challenge-token" });
    assert.equal(options.credentials, "omit");
    assert.equal(options.cache, "no-store");
    resolve(Response.json({ email }));
    await completion;
    const link = page.info.children[0].children[0];
    assert.equal(link.href, "mailto:" + email);
    assert.equal(link.textContent, email);
    assert.equal(link.focused, true);
    assert.equal(page.button.hidden, true);
    assert.equal(page.challenge.hidden, true);
    assert.equal(page.button.attributes["aria-expanded"], "true");
    assert.deepEqual(page.removed, [0]);
});

test("failed server verification never reveals the address and permits retry", async () => {
    for (const fetchImpl of [
        () => Response.json({ error: "Rejected" }, { status: 403 }),
        () => new Response("Unavailable", { status: 503 }),
        () => { throw new Error("Network error"); },
        () => new Response("invalid json"),
        () => Response.json({ email: null }),
    ]) {
        const page = load({ fetchImpl });
        await page.click();
        await page.complete("token");
        assert.equal(page.info.children.length, 0);
        assert.equal(page.button.disabled, false);
        assert.match(page.status.textContent, /try again/i);
        await page.click();
        assert.equal(page.widgets.length, 2);
    }
});

test("challenge errors, expiry, and timeouts permit retry and ignore stale callbacks", async () => {
    for (const callback of ["error-callback", "expired-callback", "timeout-callback"]) {
        const page = load();
        await page.click();
        const oldWidget = page.widgets[0];
        oldWidget[callback]();
        assert.equal(page.button.disabled, false);
        await page.click();
        oldWidget[callback]();
        await oldWidget.callback("stale-token");
        assert.equal(page.button.disabled, true);
        assert.equal(page.calls.length, 0);
        assert.equal(page.info.children.length, 0);
        await page.complete("fresh-token");
        assert.equal(page.info.children.length, 1);
    }
});

test("a stale server response cannot reveal after its challenge expires", async () => {
    let resolve;
    const page = load({ fetchImpl: () => new Promise(done => { resolve = done; }) });
    await page.click();
    const pending = page.complete("old-token");
    page.widgets[0]["expired-callback"]();
    await page.click();
    resolve(Response.json({ email }));
    await pending;
    assert.equal(page.info.children.length, 0);
    assert.equal(page.button.disabled, true);
});

test("script load failures and timeouts leave the address hidden and allow retry", async () => {
    for (const timeout of [false, true]) {
        const page = load({ preloaded: false });
        const clicked = page.click();
        if (timeout) page.timers.values().next().value();
        else page.head.children[0].onerror();
        await clicked;
        assert.equal(page.info.children.length, 0);
        assert.equal(page.button.disabled, false);
        assert.equal(page.head.children[0].removed, true);
        const retried = page.click();
        page.loaded();
        await retried;
        assert.equal(page.widgets.length, 1);
    }
});

test("an unconfigured endpoint leaves other contact options available", () => {
    const page = load({ configured: false });
    assert.equal(page.button.hidden, true);
    assert.equal(page.head.children.length, 0);
    assert.equal(page.calls.length, 0);
    assert.match(page.status.textContent, /DM me on the RustLang Zulip/);
});
