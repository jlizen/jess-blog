const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../static/js/comments.js`, "utf8");

function load(theme = "light") {
    const messages = [];
    const clients = [];
    let frame;
    let onThemeChange;
    let onFrameLoad;
    const root = { classList: { contains: value => value === theme } };
    const container = {
        querySelector: () => frame,
        appendChild: client => clients.push(client),
        addEventListener: (event, callback, capture) => {
            if (event === "load" && capture) onFrameLoad = callback;
        },
    };
    vm.runInNewContext(source, {
        document: {
            currentScript: { dataset: { repo: "owner/blog", repoId: "repo-id", category: "Comments", categoryId: "category-id" } },
            documentElement: root,
            querySelector: () => container,
            createElement: () => ({ dataset: {} }),
        },
        MutationObserver: class {
            constructor(callback) { onThemeChange = callback; }
            observe() {}
        },
    });
    return {
        clients,
        messages,
        setTheme(value) { theme = value; onThemeChange(); },
        loadFrame() {
            frame = { contentWindow: { postMessage: (message, origin) => messages.push({ message, origin }) } };
            onFrameLoad();
        },
    };
}

test("loads giscus with the configured repository and current site theme", () => {
    for (const theme of ["light", "dark"]) {
        const { clients } = load(theme);
        assert.equal(clients.length, 1);
        const [client] = clients;
        assert.equal(client.src, "https://giscus.app/client.js");
        assert.equal(client.dataset.repo, "owner/blog");
        assert.equal(client.dataset.repoId, "repo-id");
        assert.equal(client.dataset.categoryId, "category-id");
        assert.equal(client.dataset.mapping, "pathname");
        assert.equal(client.dataset.strict, "1");
        assert.equal(client.dataset.theme, theme);
        assert.equal(client.dataset.loading, "lazy");
    }
});

test("theme changes reach the loaded widget at the giscus origin", () => {
    const page = load();
    page.loadFrame();
    for (const theme of ["dark", "light"]) {
        page.setTheme(theme);
        const { message, origin } = page.messages.at(-1);
        assert.equal(message.giscus.setConfig.theme, theme);
        assert.equal(origin, "https://giscus.app");
    }
    assert.equal(page.clients.length, 1);
});

test("a delayed iframe receives theme changes made before it loaded", () => {
    const page = load();
    page.setTheme("dark");
    assert.equal(page.messages.length, 0);
    assert.equal(page.clients[0].dataset.theme, "dark");
    page.loadFrame();
    assert.equal(page.messages.at(-1).message.giscus.setConfig.theme, "dark");
});
