(() => {
    const button = document.getElementById("contact-toggle");
    const info = document.getElementById("contact-info");
    if (!button || !info) return;

    // This deters simple address scrapers; it cannot keep a public address secret.
    const encodedAddress = [114, 117, 115, 116, 64, 106, 101, 115, 115, 105, 122, 101, 110, 46, 99, 111, 109];
    button.hidden = false;

    button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";
        if (!info.firstChild) {
            const address = String.fromCharCode(...encodedAddress);
            const paragraph = document.createElement("p");
            const link = document.createElement("a");
            link.href = "mailto:" + address;
            link.textContent = address;
            paragraph.append(link);
            info.append(paragraph);
        }
        info.hidden = expanded;
        button.setAttribute("aria-expanded", String(!expanded));
    });
})();
