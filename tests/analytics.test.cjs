const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../static/js/analytics.js`, "utf8");
const token = "0123456789abcdef0123456789abcdef";

function load({ preferences = {}, windowPreferences = {}, url = "https://jlizen.github.io/jess-blog/", siteUrl = "https://jlizen.github.io/jess-blog/", siteToken = token } = {}) {
    const requests = [];
    vm.runInNewContext(source, {
        URL,
        location: new URL(url),
        navigator: preferences,
        window: windowPreferences,
        document: {
            currentScript: { dataset: { token: siteToken, siteUrl } },
            createElement: () => ({ dataset: {} }),
            body: { appendChild: script => requests.push(script) },
        },
    });
    return requests;
}

test("loads one Cloudflare beacon on the configured site", () => {
    const [beacon, ...extra] = load();
    assert.equal(beacon.src, "https://static.cloudflareinsights.com/beacon.min.js");
    assert.equal(beacon.type, "module");
    assert.deepEqual(JSON.parse(beacon.dataset.cfBeacon), { token, spa: false });
    assert.equal(extra.length, 0);
});

test("privacy opt-outs prevent the third-party request", () => {
    for (const preferences of [
        { globalPrivacyControl: true },
        { doNotTrack: "1" },
        { doNotTrack: "yes" },
        { msDoNotTrack: "1" },
    ]) {
        assert.equal(load({ preferences }).length, 0);
    }
    assert.equal(load({ windowPreferences: { doNotTrack: "1" } }).length, 0);
});

test("local previews and other origins do not send analytics", () => {
    for (const url of ["http://localhost:1111/", "http://127.0.0.1:1111/", "https://preview.example/", "http://jlizen.github.io/jess-blog/"]) {
        assert.equal(load({ url }).length, 0);
    }
});

test("a custom production domain works", () => {
    assert.equal(load({ url: "https://blog.jessizen.com/about/", siteUrl: "https://blog.jessizen.com" }).length, 1);
});

test("missing or malformed tokens do not send analytics", () => {
    for (const siteToken of ["", "invalid"]) {
        assert.equal(load({ siteToken }).length, 0);
    }
});
