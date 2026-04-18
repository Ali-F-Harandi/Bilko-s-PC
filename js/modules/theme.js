// Movie Library - Theme Module
// Handles theme switching (Light/Dark modes only)

function toggleThemeDropdown() {
    document.getElementById('themeDropdown').classList.toggle('open');
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.theme-selector')) {
        document.getElementById('themeDropdown').classList.remove('open');
    }
});

function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('.theme-option').forEach(function(o) {
        o.classList.toggle('active', o.dataset.theme === t);
    });
    document.getElementById('themeDropdown').classList.remove('open');
    localStorage.setItem('movieLibTheme', t);
}

// Export for use in other modules
window.ThemeManager = { toggleThemeDropdown, setTheme };
