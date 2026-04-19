// Movie Library - Main Application Entry Point
// Initializes the app and sets up global state and event listeners

// Global State
window.allMovies = [];
window.filteredMovies = [];
window.skippedFolders = [];

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    if (document.getElementById('playerModal').classList.contains('active')) {
        if (window.VideoPlayer.isPlayingTVShow()) {
            // TV Show player shortcuts
            if (e.key === 'ArrowLeft') window.playPrevEpisode();
            if (e.key === 'ArrowRight') window.playNextEpisode();
            if (e.key === 'Escape') window.VideoPlayer.closePlayer();
        } else {
            // Movie player shortcuts
            if (e.key === 'ArrowLeft') window.VideoPlayer.playMovie(window.VideoPlayer.getCurrentIndex() - 1);
            if (e.key === 'ArrowRight') window.VideoPlayer.playMovie(window.VideoPlayer.getCurrentIndex() + 1);
            if (e.key === 'Escape') window.VideoPlayer.closePlayer();
        }
    } else if (document.getElementById('detailPage').classList.contains('active')) {
        if (e.key === 'Escape') window.DetailPage.closeDetailPage();
    } else if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        // Tab keyboard shortcuts: Ctrl+1 through Ctrl+6
        var tabMap = { '1': 'all', '2': 'movies', '3': 'tvshows', '4': 'animation', '5': 'anime', '6': 'collections' };
        var tab = tabMap[e.key];
        if (tab) {
            // Only switch if the tab is visible (animation/anime may be hidden)
            var tabBtn = document.querySelector('.nav-tab[data-tab="' + tab + '"]');
            if (tabBtn && !tabBtn.classList.contains('hidden-tab')) {
                e.preventDefault();
                window.switchTab(tab);
            }
        }
    }
});

// ============================================================================
// SCROLL-TO-TOP BUTTON LOGIC
// ============================================================================
window.scrollToTop = function() {
    var mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

(function() {
    var scrollBtn = null;
    var scrollThreshold = 400;

    function updateScrollButton() {
        if (!scrollBtn) scrollBtn = document.getElementById('scrollToTopBtn');
        if (!scrollBtn) return;
        var scrollY = window.scrollY || document.documentElement.scrollTop;
        if (scrollY > scrollThreshold) {
            scrollBtn.classList.add('visible');
            scrollBtn.classList.remove('hidden');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', updateScrollButton, { passive: true });
    // Also check after DOM mutations (e.g. after library loads)
    setInterval(updateScrollButton, 2000);
})();

// Initialization
window.addEventListener('DOMContentLoaded', function() {
    // Restore theme
    var savedTheme = localStorage.getItem('movieLibTheme') || 'dark';
    window.ThemeManager.setTheme(savedTheme);

    // Check for saved session
    window.DBUtils.getSetting('folderHandles').then(function(handles) {
        if (handles && handles.length > 0) {
            document.getElementById('btnResume').classList.remove('hidden');
        }
    }).catch(function() {});
});
