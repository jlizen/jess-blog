(() => {
    const contact = document.querySelector(".contact");
    const button = document.getElementById("contact-toggle");
    const info = document.getElementById("contact-info");
    const status = document.getElementById("contact-status");
    const challenge = document.getElementById("contact-challenge");
    if (!contact || !button || !info || !status || !challenge) return;

    const { sitekey, endpoint } = document.currentScript.dataset;
    if (!sitekey || !endpoint) {
        status.textContent = "Email is temporarily unavailable. DM me on the RustLang Zulip using the link below.";
        return;
    }

    let widgetId = null;
    let attempt = 0;
    let verifying = false;
    let revealed = false;
    button.hidden = false;

    function loadTurnstile() {
        if (window.turnstile) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            const timer = setTimeout(failed, 15000);
            function failed() {
                clearTimeout(timer);
                script.remove();
                delete window.onContactTurnstileLoad;
                reject(new Error("Turnstile could not load."));
            }
            window.onContactTurnstileLoad = () => {
                clearTimeout(timer);
                delete window.onContactTurnstileLoad;
                resolve();
            };
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onContactTurnstileLoad";
            script.async = true;
            script.onerror = failed;
            document.head.append(script);
        });
    }

    function retry(message, currentAttempt) {
        if (revealed || currentAttempt !== attempt) return;
        attempt += 1;
        verifying = false;
        if (widgetId !== null) window.turnstile.remove(widgetId);
        widgetId = null;
        challenge.hidden = true;
        button.disabled = false;
        button.textContent = "Try again";
        status.textContent = message;
    }

    async function reveal(token, currentAttempt) {
        if (revealed || verifying || currentAttempt !== attempt) return;
        verifying = true;
        status.textContent = "Checking verification…";
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
                credentials: "omit",
                cache: "no-store",
                signal: AbortSignal.timeout(15000),
            });
            if (!response.ok) throw new Error("Verification failed.");
            const { email } = await response.json();
            if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+$/.test(email)) {
                throw new Error("Invalid contact response.");
            }
            if (currentAttempt !== attempt) return;
            revealed = true;
            const paragraph = document.createElement("p");
            const link = document.createElement("a");
            link.href = "mailto:" + encodeURIComponent(email).replace("%40", "@");
            link.textContent = email;
            paragraph.append(link);
            info.replaceChildren(paragraph);
            status.textContent = "";
            challenge.hidden = true;
            button.hidden = true;
            button.setAttribute("aria-expanded", "true");
            if (widgetId !== null) window.turnstile.remove(widgetId);
            widgetId = null;
            link.focus();
        } catch {
            retry("Could not verify. Please try again, or DM me on the RustLang Zulip using the link below.", currentAttempt);
        }
    }

    button.addEventListener("click", async () => {
        if (button.disabled || revealed) return;
        button.disabled = true;
        const currentAttempt = ++attempt;
        status.textContent = "Complete the verification to view the email address.";
        challenge.hidden = false;
        try {
            await loadTurnstile();
            const renderedWidget = window.turnstile.render(challenge, {
                sitekey,
                action: "reveal-email",
                size: "flexible",
                theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
                "response-field": false,
                retry: "never",
                "refresh-expired": "manual",
                "refresh-timeout": "manual",
                callback: token => reveal(token, currentAttempt),
                "error-callback": () => retry("Verification could not load. Please try again, or DM me on the RustLang Zulip using the link below.", currentAttempt),
                "expired-callback": () => retry("Verification expired. Please try again.", currentAttempt),
                "timeout-callback": () => retry("Verification timed out. Please try again.", currentAttempt),
            });
            if (currentAttempt === attempt && !revealed) widgetId = renderedWidget;
            else window.turnstile.remove(renderedWidget);
        } catch {
            retry("Verification could not load. Please try again, or DM me on the RustLang Zulip using the link below.", currentAttempt);
        }
    });
})();
