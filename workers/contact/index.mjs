const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ACTION = "reveal-email";

export async function handleContact(request, env, verify = fetch) {
    const origin = request.headers.get("Origin");
    const headers = {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Vary": "Origin",
    };
    const respond = (status, body) => new Response(JSON.stringify(body), { status, headers });

    if (new URL(request.url).pathname !== "/api/contact") {
        return respond(404, { error: "Not found." });
    }
    if (!env.SITE_ORIGIN || origin !== env.SITE_ORIGIN) {
        return respond(403, { error: "Request not allowed." });
    }
    headers["Access-Control-Allow-Origin"] = origin;

    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                ...headers,
                "Access-Control-Allow-Methods": "POST",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }
    if (request.method !== "POST") {
        headers.Allow = "POST, OPTIONS";
        return respond(405, { error: "Method not allowed." });
    }
    if (!env.TURNSTILE_SECRET_KEY || !env.CONTACT_EMAIL) {
        return respond(503, { error: "Contact information is unavailable." });
    }
    if (request.headers.get("Content-Type")?.split(";")[0].trim() !== "application/json") {
        return respond(415, { error: "Expected JSON." });
    }

    // Bound the actual body, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return respond(400, { error: "Missing verification token." });
    const chunks = [];
    let size = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 4096) {
                await reader.cancel();
                return respond(413, { error: "Request too large." });
            }
            chunks.push(value);
        }
    } catch {
        return respond(400, { error: "Invalid request." });
    }

    let token;
    try {
        const body = await new Response(new Blob(chunks)).json();
        token = body?.token;
    } catch {
        return respond(400, { error: "Invalid request." });
    }
    if (typeof token !== "string" || !token.trim() || token.length > 2048) {
        return respond(400, { error: "Invalid verification token." });
    }

    try {
        const response = await verify(SITEVERIFY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) return respond(502, { error: "Verification is unavailable. Try again." });
        const result = await response.json();
        // Bind the token to this site and purpose, not just any successful challenge.
        if (result?.success !== true || result.hostname !== new URL(env.SITE_ORIGIN).hostname || result.action !== ACTION) {
            return respond(403, { error: "Verification failed. Try again." });
        }
    } catch {
        return respond(502, { error: "Verification is unavailable. Try again." });
    }

    return respond(200, { email: env.CONTACT_EMAIL });
}

export default {
    fetch(request, env) {
        return handleContact(request, env);
    },
};
