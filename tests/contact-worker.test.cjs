const assert = require("node:assert/strict");
const { test } = require("node:test");

const env = {
    SITE_ORIGIN: "https://blog.example.com",
    TURNSTILE_SECRET_KEY: "test-secret",
    CONTACT_EMAIL: "hello@example.com",
};
const valid = { success: true, hostname: "blog.example.com", action: "reveal-email" };

function request({ origin = env.SITE_ORIGIN, method = "POST", body = '{"token":"test-token"}', type = "application/json", path = "/api/contact" } = {}) {
    const headers = { "Content-Type": type };
    if (origin !== null) headers.Origin = origin;
    return new Request("https://contact.example.workers.dev" + path, {
        method,
        headers,
        ...(method === "POST" ? { body } : {}),
    });
}

async function run(req = request(), { result = valid, settings = env, verify } = {}) {
    const { handleContact } = await import("../workers/contact/index.mjs");
    const calls = [];
    const response = await handleContact(req, settings, async (url, options) => {
        calls.push({ url, options });
        return verify ? verify() : Response.json(result);
    });
    return { response, calls };
}

async function assertDenied(response, status) {
    assert.equal(response.status, status);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const body = await response.text();
    assert.ok(!body.includes(env.CONTACT_EMAIL));
    assert.ok(!body.includes(env.TURNSTILE_SECRET_KEY));
}

test("returns the address only after server-side verification and never caches it", async () => {
    const { response, calls } = await run();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { email: env.CONTACT_EMAIL });
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), env.SITE_ORIGIN);
    assert.equal(response.headers.get("Vary"), "Origin");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    assert.equal(calls[0].options.method, "POST");
    assert.deepEqual(JSON.parse(calls[0].options.body), { secret: env.TURNSTILE_SECRET_KEY, response: "test-token" });
});

test("rejects failed, expired, reused, wrong-host, and wrong-action tokens", async () => {
    for (const result of [
        { success: false },
        { success: false, "error-codes": ["timeout-or-duplicate"] },
        { ...valid, success: "true" },
        { ...valid, hostname: "attacker.example" },
        { ...valid, action: "other-action" },
        { success: true },
        null,
    ]) {
        const { response } = await run(request(), { result });
        await assertDenied(response, 403);
    }
});

test("verification outages and malformed upstream responses fail closed", async () => {
    for (const verify of [
        () => { throw new Error("Network error"); },
        () => { throw new DOMException("Timed out", "TimeoutError"); },
        () => new Response("unavailable", { status: 503 }),
        () => new Response("not json"),
    ]) {
        const { response } = await run(request(), { verify });
        await assertDenied(response, 502);
    }
});

test("invalid requests never reach Siteverify", async () => {
    for (const [options, expected] of [
        [{ method: "GET" }, 405],
        [{ path: "/" }, 404],
        [{ type: "text/plain" }, 415],
        [{ body: null }, 400],
        [{ body: "invalid json" }, 400],
        [{ body: "null" }, 400],
        [{ body: "{}" }, 400],
        [{ body: '{"token":true}' }, 400],
        [{ body: '{"token":"  "}' }, 400],
        [{ body: JSON.stringify({ token: "a".repeat(2049) }) }, 400],
        [{ body: JSON.stringify({ token: "a".repeat(5000) }) }, 413],
    ]) {
        const { response, calls } = await run(request(options));
        await assertDenied(response, expected);
        assert.equal(calls.length, 0);
    }
});

test("missing Worker secrets fail closed without contacting Siteverify", async () => {
    for (const key of ["TURNSTILE_SECRET_KEY", "CONTACT_EMAIL"]) {
        const { response, calls } = await run(request(), { settings: { ...env, [key]: "" } });
        await assertDenied(response, 503);
        assert.equal(calls.length, 0);
    }
});

test("only the configured site can use CORS, including preflight requests", async () => {
    const { response: preflight, calls } = await run(request({ method: "OPTIONS" }));
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), env.SITE_ORIGIN);
    assert.equal(preflight.headers.get("Access-Control-Allow-Methods"), "POST");
    assert.equal(calls.length, 0);
    for (const method of ["POST", "OPTIONS"]) {
        for (const origin of [null, "null", "https://attacker.example", "https://blog.example.com.attacker.example"]) {
            const { response, calls } = await run(request({ method, origin }));
            await assertDenied(response, 403);
            assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
            assert.equal(calls.length, 0);
        }
    }
});
