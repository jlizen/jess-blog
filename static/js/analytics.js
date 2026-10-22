(() => {
    const loader = document.currentScript;
    const token = loader?.dataset.token;
    if (!token || !/^[a-f0-9]{32}$/i.test(token)) return;

    const site = new URL(loader.dataset.siteUrl);
    if (location.protocol !== "https:" || location.origin !== site.origin) return;

    const doNotTrack = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (navigator.globalPrivacyControl || doNotTrack === "1" || doNotTrack === "yes") return;

    // Load only after checking privacy preferences, so opting out makes no beacon request.
    const beacon = document.createElement("script");
    beacon.type = "module";
    beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
    beacon.dataset.cfBeacon = JSON.stringify({ token, spa: false });
    document.body.appendChild(beacon);
})();
