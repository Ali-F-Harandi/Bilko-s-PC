// Movie Library - Video Player Module
// Handles video playback functionality

var currentMovieIndex = -1;

async function playMovie(idx) {
    if (idx < 0 || idx >= window.filteredMovies.length) return;

    currentMovieIndex = idx;
    var m = window.filteredMovies[idx];

    try {
        var f = await m.videoHandle.getFile();
        var url = URL.createObjectURL(f);
        var vid = document.getElementById('videoPlayer');
        vid.src = url;
        vid.play();

        document.getElementById('playerTitle').textContent = m.title + ' (' + m.year + ')';
        document.getElementById('playerModal').classList.add('active');
        document.getElementById('prevBtn').disabled = idx === 0;
        document.getElementById('nextBtn').disabled = idx === window.filteredMovies.length - 1;

        window.DetailPage.closeDetailPage();
    } catch(e) {
        window.Utils.showToast('Error playing video: ' + e.message, 'warning');
    }
}

function closePlayer() {
    var v = document.getElementById('videoPlayer');
    v.pause();
    v.removeAttribute('src');
    v.load();
    document.getElementById('playerModal').classList.remove('active');
}

// Export for use in other modules
window.VideoPlayer = { playMovie, closePlayer, getCurrentIndex: function() { return currentMovieIndex; }, setCurrentIndex: function(i) { currentMovieIndex = i; } };
