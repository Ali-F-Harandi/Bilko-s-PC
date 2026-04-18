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
    }
});

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
