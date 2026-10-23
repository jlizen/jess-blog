(() => {
    const settings = document.currentScript.dataset;
    const container = document.querySelector(".giscus");
    const client = document.createElement("script");
    client.src = "https://giscus.app/client.js";
    client.async = true;
    client.crossOrigin = "anonymous";
    Object.assign(client.dataset, {
        repo: settings.repo,
        repoId: settings.repoId,
        category: settings.category,
        categoryId: settings.categoryId,
        mapping: "pathname",
        strict: "1",
        reactionsEnabled: "1",
        emitMetadata: "0",
        inputPosition: "top",
        lang: "en",
        loading: "lazy",
    });

    function updateTheme() {
        const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
        client.dataset.theme = theme;
        const frame = container.querySelector("iframe.giscus-frame");
        frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, "https://giscus.app");
    }

    // Apollo updates the root class for both the toggle and system theme changes.
    new MutationObserver(updateTheme).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
    });
    // A lazy iframe can finish loading after the visitor changes the theme.
    container.addEventListener("load", updateTheme, true);
    updateTheme();
    container.appendChild(client);
})();
