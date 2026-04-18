// Movie Library - Video Player Module
// Handles video playback using HTML5 video player with advanced features

var currentMovieIndex = -1;
var currentVideoUrl = null;
var loadedSubtitleFiles = new Map(); // Cache for loaded subtitle files

async function playMovie(idx) {
    console.log('[VideoPlayer Debug] playMovie called with index:', idx);
    
    if (idx < 0 || idx >= window.filteredMovies.length) {
        console.error('[VideoPlayer Debug] Invalid index:', idx);
        return;
    }

    currentMovieIndex = idx;
    var m = window.filteredMovies[idx];
    
    console.log('[VideoPlayer Debug] Playing movie:', m.title, 'handle:', m.videoHandle);

    try {
        // Open file using File System Access API
        if (m.videoHandle && typeof m.videoHandle.getFile === 'function') {
            console.log('[VideoPlayer Debug] Opening file in web player...');
            const file = await m.videoHandle.getFile();
            
            // Revoke previous URL if exists
            if (currentVideoUrl) {
                URL.revokeObjectURL(currentVideoUrl);
            }
            
            currentVideoUrl = URL.createObjectURL(file);
            
            // Setup video player modal
            setupWebPlayer(m, currentVideoUrl);
            
            console.log('[VideoPlayer Debug] Web player initialized');
            window.Utils.showToast('Playing ' + m.title, 'success');
        } else {
            console.error('[VideoPlayer Debug] videoHandle or getFile method not available');
            window.Utils.showToast('Cannot open file: File handle not available', 'warning');
        }
    } catch(e) {
        console.error('[VideoPlayer Debug] Error opening movie:', e);
        window.Utils.showToast('Error opening video: ' + e.message, 'warning');
    }
}

async function setupWebPlayer(movie, videoUrl) {
    const modal = document.getElementById('playerModal');
    const video = document.getElementById('videoPlayer');
    const title = document.getElementById('playerTitle');
    
    // Set title
    title.textContent = movie.title + ' (' + movie.year + ')';
    
    // Load video
    video.src = videoUrl;
    video.load();
    
    // Show modal
    modal.classList.add('active');
    
    // Load subtitles from folder
    await loadSubtitlesForMovie(movie, video);
    
    // Setup event listeners
    video.onloadedmetadata = function() {
        console.log('[VideoPlayer Debug] Video loaded, duration:', video.duration);
        
        // Check for multiple audio tracks
        checkAudioTracks(video);
        
        // Auto-play
        video.play().catch(e => console.log('[VideoPlayer Debug] Auto-play prevented:', e));
    };
    
    video.onerror = function(e) {
        console.error('[VideoPlayer Debug] Video error:', e);
        window.Utils.showToast('Error loading video', 'warning');
    };
}

function checkAudioTracks(video) {
    // Wait a bit for tracks to be available
    setTimeout(function() {
        const audioTracks = video.audioTracks;
        if (audioTracks && audioTracks.length > 1) {
            console.log('[VideoPlayer Debug] Found', audioTracks.length, 'audio tracks');
            updateAudioMenu(audioTracks, video);
        } else {
            console.log('[VideoPlayer Debug] Single or no audio tracks found');
        }
    }, 500);
}

function updateAudioMenu(audioTracks, videoElement) {
    let menuContainer = document.getElementById('audioMenuContainer');
    
    if (!menuContainer) {
        // Create audio menu container
        const playerHeader = document.querySelector('.player-header');
        menuContainer = document.createElement('div');
        menuContainer.id = 'audioMenuContainer';
        menuContainer.className = 'player-subtitle-menu';
        menuContainer.innerHTML = `
            <div class="player-control-group">
                <button class="player-control-btn" id="audioBtn" onclick="toggleAudioMenu()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                    <span>Audio</span>
                </button>
                <div class="player-dropdown" id="audioDropdown">
                    <div id="audioList"></div>
                </div>
            </div>
        `;
        playerHeader.appendChild(menuContainer);
    }
    
    const list = document.getElementById('audioList');
    const btn = document.getElementById('audioBtn');
    
    // Build audio track list
    let html = '';
    for (let i = 0; i < audioTracks.length; i++) {
        const track = audioTracks[i];
        const label = track.label || track.language || 'Track ' + (i + 1);
        const isActive = track.enabled ? ' active' : '';
        html += '<button class="player-dropdown-item' + isActive + '" data-track="' + i + '" onclick="selectAudioTrack(' + i + ')">' + 
                label + '</button>';
    }
    list.innerHTML = html;
    
    // Store reference to video element
    window.currentVideoElement = videoElement;
}

window.toggleAudioMenu = function() {
    const dropdown = document.getElementById('audioDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
};

window.selectAudioTrack = function(trackIndex) {
    const video = window.currentVideoElement || document.getElementById('videoPlayer');
    if (!video || !video.audioTracks) return;
    
    const audioTracks = video.audioTracks;
    if (trackIndex >= 0 && trackIndex < audioTracks.length) {
        // Disable all tracks first
        for (let i = 0; i < audioTracks.length; i++) {
            audioTracks[i].enabled = false;
        }
        // Enable selected track
        audioTracks[trackIndex].enabled = true;
        
        // Update UI
        const items = document.querySelectorAll('#audioList .player-dropdown-item');
        items.forEach((item, idx) => {
            if (idx === trackIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        const trackName = audioTracks[trackIndex].label || audioTracks[trackIndex].language || 'Track ' + (trackIndex + 1);
        window.Utils.showToast('Audio: ' + trackName, 'info');
        toggleAudioMenu();
    }
};

async function loadSubtitlesForMovie(movie, videoElement) {
    console.log('[VideoPlayer Debug] Loading subtitles for:', movie.title);
    
    try {
        // Get parent directory handle
        const parentDir = movie.videoHandle.parent;
        if (!parentDir) {
            console.log('[VideoPlayer Debug] No parent directory access');
            updateSubtitleMenu([]);
            return;
        }
        
        const subtitleExts = ['.srt', '.vtt', '.ass', '.ssa', '.sub'];
        const subtitleFiles = [];
        
        // Scan for subtitle files
        for await (const entry of parentDir.values()) {
            if (entry.kind !== 'file') continue;
            const lowerName = entry.name.toLowerCase();
            
            // Check if it's a subtitle file and belongs to this movie
            const isSubtitle = subtitleExts.some(ext => lowerName.endsWith(ext));
            const isRelated = lowerName.includes(movie.title.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
                             lowerName.includes(movie.fileName.toLowerCase().replace(/\.[^.]+$/, ''));
            
            if (isSubtitle && isRelated) {
                subtitleFiles.push(entry);
            }
        }
        
        console.log('[VideoPlayer Debug] Found', subtitleFiles.length, 'subtitle files');
        updateSubtitleMenu(subtitleFiles);
        
    } catch(e) {
        console.error('[VideoPlayer Debug] Error loading subtitles:', e);
        updateSubtitleMenu([]);
    }
}

function updateSubtitleMenu(subtitleFiles) {
    let menuContainer = document.getElementById('subtitleMenuContainer');
    
    if (!menuContainer) {
        // Create subtitle menu container
        const playerHeader = document.querySelector('.player-header');
        menuContainer = document.createElement('div');
        menuContainer.id = 'subtitleMenuContainer';
        menuContainer.className = 'player-subtitle-menu';
        menuContainer.innerHTML = `
            <div class="player-control-group">
                <button class="player-control-btn" id="subtitleBtn" onclick="toggleSubtitleMenu()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <line x1="4" y1="8" x2="20" y2="8"/>
                        <line x1="4" y1="12" x2="14" y2="12"/>
                    </svg>
                    <span>CC</span>
                </button>
                <div class="player-dropdown" id="subtitleDropdown">
                    <button class="player-dropdown-item" onclick="disableSubtitles()">No Subtitles</button>
                    <div id="subtitleList"></div>
                </div>
            </div>
        `;
        playerHeader.appendChild(menuContainer);
    }
    
    const list = document.getElementById('subtitleList');
    const dropdown = document.getElementById('subtitleDropdown');
    const btn = document.getElementById('subtitleBtn');
    
    // Hide if no subtitles
    if (subtitleFiles.length === 0) {
        if (btn) btn.style.display = 'none';
        return;
    }
    
    if (btn) btn.style.display = 'flex';
    
    // Build subtitle list
    let html = '';
    subtitleFiles.forEach((file, index) => {
        const lang = extractLanguageFromFilename(file.name);
        html += '<button class="player-dropdown-item" onclick="loadSubtitle(' + index + ', \'' + file.name.replace(/'/g, "\\'") + '\')">' + 
                lang + '</button>';
    });
    list.innerHTML = html;
    
    // Store subtitle files globally for access
    window.currentSubtitleFiles = subtitleFiles;
}

function extractLanguageFromFilename(filename) {
    const langPatterns = [
        /\.([a-z]{2,3})\.(?:srt|vtt|ass|ssa|sub)$/i,
        /\.([a-z]{2,3})$/i
    ];
    
    for (const pattern of langPatterns) {
        const match = filename.match(pattern);
        if (match) {
            const langCode = match[1].toLowerCase();
            const langNames = {
                'en': 'English', 'eng': 'English',
                'es': 'Spanish', 'spa': 'Spanish',
                'fr': 'French', 'fra': 'French',
                'de': 'German', 'deu': 'German',
                'it': 'Italian', 'ita': 'Italian',
                'pt': 'Portuguese', 'por': 'Portuguese',
                'ru': 'Russian', 'rus': 'Russian',
                'ja': 'Japanese', 'jpn': 'Japanese',
                'ko': 'Korean', 'kor': 'Korean',
                'zh': 'Chinese', 'chi': 'Chinese',
                'ar': 'Arabic', 'ara': 'Arabic',
                'hi': 'Hindi', 'hin': 'Hindi',
                'th': 'Thai', 'tha': 'Thai',
                'vi': 'Vietnamese', 'vie': 'Vietnamese'
            };
            return langNames[langCode] || langCode.toUpperCase();
        }
    }
    
    // Fallback to filename
    return filename.replace(/\.[^.]+$/, '');
}

window.toggleSubtitleMenu = function() {
    const dropdown = document.getElementById('subtitleDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
};

window.disableSubtitles = function() {
    const video = document.getElementById('videoPlayer');
    // Remove all subtitle tracks
    const tracks = video.textTracks;
    for (let i = tracks.length - 1; i >= 0; i--) {
        tracks[i].mode = 'disabled';
    }
    // Clear any manually added tracks
    while (video.firstChild && video.firstChild.tagName === 'TRACK') {
        video.removeChild(video.firstChild);
    }
    window.Utils.showToast('Subtitles disabled', 'info');
    toggleSubtitleMenu();
};

window.loadSubtitle = async function(index, filename) {
    const files = window.currentSubtitleFiles;
    if (!files || !files[index]) return;
    
    try {
        const file = await files[index].getFile();
        const content = await file.text();
        
        const video = document.getElementById('videoPlayer');
        const lang = extractLanguageFromFilename(filename);
        
        // Remove existing tracks
        while (video.firstChild && video.firstChild.tagName === 'TRACK') {
            video.removeChild(video.firstChild);
        }
        
        // Create blob URL for subtitle
        const blob = new Blob([content], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        
        // Add track element
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = lang;
        track.srclang = lang.toLowerCase().split(' ')[0].toLowerCase();
        track.src = url;
        track.default = true;
        
        video.appendChild(track);
        
        // Enable the track
        track.addEventListener('load', function() {
            const tracks = video.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = tracks[i] === track ? 'showing' : 'disabled';
            }
        });
        
        window.Utils.showToast('Loaded: ' + lang, 'success');
        toggleSubtitleMenu();
        
    } catch(e) {
        console.error('[VideoPlayer Debug] Error loading subtitle:', e);
        window.Utils.showToast('Failed to load subtitle', 'warning');
    }
};

function closePlayer() {
    var v = document.getElementById('videoPlayer');
    if (v) {
        v.pause();
        v.removeAttribute('src');
        v.load();
    }
    
    // Clean up subtitle menu
    const subtitleMenuContainer = document.getElementById('subtitleMenuContainer');
    if (subtitleMenuContainer) {
        subtitleMenuContainer.remove();
    }
    
    // Clean up audio menu
    const audioMenuContainer = document.getElementById('audioMenuContainer');
    if (audioMenuContainer) {
        audioMenuContainer.remove();
    }
    
    // Revoke video URL
    if (currentVideoUrl) {
        URL.revokeObjectURL(currentVideoUrl);
        currentVideoUrl = null;
    }
    
    // Clear global references
    window.currentSubtitleFiles = null;
    window.currentVideoElement = null;
    
    document.getElementById('playerModal').classList.remove('active');
}

// Export for use in other modules
window.VideoPlayer = { 
    playMovie, 
    closePlayer, 
    getCurrentIndex: function() { return currentMovieIndex; }, 
    setCurrentIndex: function(i) { currentMovieIndex = i; } 
};
