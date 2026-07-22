document.addEventListener("DOMContentLoaded", () => {
    const backToTop = document.createElement("button");
    backToTop.className = "back-to-top";
    backToTop.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    backToTop.setAttribute("aria-label", "Back to top");
    document.body.appendChild(backToTop);

    const supportButton = document.createElement("button");
    supportButton.className = "support-float";
    supportButton.innerHTML = '<i class="fa-solid fa-headset me-2"></i>Support';
    document.body.appendChild(supportButton);

    window.addEventListener("scroll", () => {
        backToTop.style.display = window.scrollY > 400 ? "inline-flex" : "none";
    });

    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    const toggle = document.createElement("button");
    toggle.className = "support-float ms-2";
    toggle.style.left = "auto";
    toggle.style.right = "1.25rem";
    toggle.style.bottom = "5.25rem";
    toggle.innerHTML = '<i class="fa-solid fa-moon me-2"></i>Dark';
    document.body.appendChild(toggle);

    toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");
        const isDark = document.body.classList.contains("dark-theme");
        document.documentElement.style.colorScheme = isDark ? "dark" : "light";
        toggle.innerHTML = isDark ? '<i class="fa-solid fa-sun me-2"></i>Light' : '<i class="fa-solid fa-moon me-2"></i>Dark';
    });

    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
        const suggestions = document.createElement("div");
        suggestions.className = "panel-card p-3 mt-2 position-absolute";
        suggestions.style.display = "none";
        suggestions.style.zIndex = "1000";
        searchInput.parentNode.appendChild(suggestions);
        searchInput.addEventListener("input", () => {
            const value = searchInput.value.trim().toLowerCase();
            if (!value) {
                suggestions.style.display = "none";
                return;
            }
            const presetSuggestions = ["Beach house", "Mountain cabin", "Luxury villa", "City loft", "Pet friendly stay"];
            const matches = presetSuggestions.filter(item => item.toLowerCase().includes(value));
            suggestions.innerHTML = matches.length ? matches.map(item => `<div class="py-1">${item}</div>`).join("") : "<div class=\"py-1\">No matches yet</div>";
            suggestions.style.display = "block";
        });
    }
});