// Movie Library - Pure JavaScript Application
// No dependencies required

// ── IndexedDB Helpers ──
const DB_NAME = 'MovieLibraryDB';
const STORE_NAME = 'settings';

function openDB() {
    return new Promise(function(resolve, reject) {
        var request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = function(e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = function(e) {
            resolve(e.target.result);
        };
        request.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

async function saveSetting(key, value) {
    var db = await openDB();
    return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function(e) { reject(e.target.error); };
    });
}

async function getSetting(key) {
    var db = await openDB();
    return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var request = tx.objectStore(STORE_NAME).get(key);
        request.onsuccess = function(e) { resolve(e.target.result); };
        request.onerror = function(e) { reject(e.target.error); };
    });
}

// ── Global State ──
var allMovies = [];
var filteredMovies = [];
var skippedFolders = [];
var currentView = localStorage.getItem('movieLibView') || 'grid';
var currentMovieIndex = -1;
var VIDEO_EXTS = ['.mp4','.mkv','.webm','.avi','.mov','.wmv','.flv','.m4v','.ts','.mpg','.mpeg'];
var IMG_EXTS = ['.jpg','.jpeg','.png','.webp','.gif','.bmp'];
var MOVIE_REGEX = /^(.+?)\s*\((\d{4})\)$/;
var THEMES = ['netflix-dark','ocean-blue','cyberpunk','amber-gold','forest-green','light-clean'];

// ── Utility Functions ──
function showToast(msg, type) {
    var c = document.getElementById('toastContainer');
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function() { t.remove(); }, 4000);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024;
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + 'BKMGTP'[i] + 'B';
}

function escHtml(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

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

function setView(view) {
    currentView = view;
    localStorage.setItem('movieLibView', view);
    document.querySelectorAll('.view-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    renderMovies();
}

// ── NFO Parser ──
function parseNFO(xmlText) {
    var res = {
        rating: null, ratingVotes: null, plot: null, runtime: null,
        genres: [], tags: [], directors: [], writers: [], actors: [],
        certification: null, country: null, studio: null, tagline: null,
        imdbId: null, tmdbId: null, premiered: null, title: null,
        originaltitle: null, onlineFanart: null, source: null,
        videoCodec: null, videoResolution: null, videoAspect: null,
        audioCodec: null, audioChannels: null
    };
    
    try {
        var doc = new DOMParser().parseFromString(xmlText, 'text/xml');
        
        var tag = function(n) {
            var el = doc.getElementsByTagName(n);
            return el.length ? el[0].textContent.trim() : null;
        };
        
        var multiTag = function(n) {
            var els = doc.getElementsByTagName(n);
            var out = [];
            for (var i = 0; i < els.length; i++) {
                out.push(els[i].textContent.trim());
            }
            return out;
        };
        
        res.title = tag('title');
        res.originaltitle = tag('originaltitle');
        res.year = tag('year');
        res.plot = tag('plot') || tag('outline');
        res.runtime = tag('runtime');
        res.tagline = tag('tagline');
        res.certification = tag('mpaa') || tag('certification');
        res.country = tag('country');
        res.studio = tag('studio');
        res.premiered = tag('premiered');
        res.source = tag('source');
        res.genres = multiTag('genre');
        res.tags = multiTag('tag');
        res.imdbId = tag('id');
        
        // Parse unique IDs
        var uids = doc.getElementsByTagName('uniqueid');
        for (var u = 0; u < uids.length; u++) {
            if (uids[u].getAttribute('type') === 'tmdb' && uids[u].textContent.trim()) {
                res.tmdbId = uids[u].textContent.trim();
            }
            if (uids[u].getAttribute('type') === 'imdb' && uids[u].textContent.trim()) {
                res.imdbId = uids[u].textContent.trim();
            }
        }
        
        // Parse rating
        var defaultR = doc.querySelector('rating[default="true"]');
        if (defaultR) {
            var vEl = defaultR.querySelector('value');
            var vtEl = defaultR.querySelector('votes');
            if (vEl) res.rating = parseFloat(vEl.textContent);
            if (vtEl) res.ratingVotes = parseInt(vtEl.textContent);
        }
        if (res.rating === null) {
            var anyR = doc.querySelector('rating');
            if (anyR) {
                var v2 = anyR.querySelector('value');
                var vt2 = anyR.querySelector('votes');
                if (v2) res.rating = parseFloat(v2.textContent);
                if (vt2) res.ratingVotes = parseInt(vt2.textContent);
            }
        }
        
        // Fanart
        var fanartEl = doc.querySelector('fanart thumb');
        if (fanartEl) res.onlineFanart = fanartEl.textContent.trim();
        
        // Directors & Writers
        var dirs = doc.getElementsByTagName('director');
        for (var i = 0; i < dirs.length; i++) {
            res.directors.push(dirs[i].textContent.trim());
        }
        var creds = doc.getElementsByTagName('credits');
        for (var j = 0; j < creds.length; j++) {
            res.writers.push(creds[j].textContent.trim());
        }
        res.directors = res.directors.filter(function(v, idx, a) { return a.indexOf(v) === idx; });
        res.writers = res.writers.filter(function(v, idx, a) { return a.indexOf(v) === idx; });
        
        // Actors
        var actors = doc.getElementsByTagName('actor');
        for (var k = 0; k < actors.length; k++) {
            var nEl = actors[k].querySelector('name');
            var rEl = actors[k].querySelector('role');
            var tEl = actors[k].querySelector('thumb');
            var name = nEl ? nEl.textContent.trim() : '';
            var role = rEl ? rEl.textContent.trim() : '';
            var thumb = tEl ? tEl.textContent.trim() : '';
            if (name) res.actors.push({ name: name, role: role, thumb: thumb });
        }
        
        // Video/Audio specs
        var video = doc.querySelector('fileinfo streamdetails video');
        if (video) {
            var vc = video.querySelector('codec');
            if (vc) res.videoCodec = vc.textContent.trim().toUpperCase();
            var vr = video.querySelector('resolution');
            if (vr) res.videoResolution = vr.textContent.trim() + 'p';
            var va = video.querySelector('aspect');
            if (va) res.videoAspect = va.textContent.trim();
        }
        
        var audio = doc.querySelector('fileinfo streamdetails audio');
        if (audio) {
            var ac = audio.querySelector('codec');
            if (ac) res.audioCodec = ac.textContent.trim().toUpperCase();
            var ach = audio.querySelector('channels');
            if (ach) res.audioChannels = ach.textContent.trim();
        }
    } catch(e) {
        console.error('NFO parse error:', e);
    }
    
    return res;
}

// ── Folder Scanning ──
async function selectFolder() {
    if (!window.showDirectoryPicker) {
        showToast('Use Chrome or Edge browser', 'warning');
        return;
    }
    try {
        var dir = await window.showDirectoryPicker({ mode: 'read' });
        await saveSetting('folderHandles', [dir]);
        await startScanning([dir]);
    } catch(e) {
        document.getElementById('loadingOverlay').classList.add('hidden');
        if (e.name !== 'AbortError') {
            showToast('Error: ' + e.message, 'warning');
        }
    }
}

async function addFolder() {
    if (!window.showDirectoryPicker) {
        showToast('Use Chrome or Edge browser', 'warning');
        return;
    }
    try {
        var dir = await window.showDirectoryPicker({ mode: 'read' });
        var handles = await getSetting('folderHandles') || [];
        
        // Check for duplicates
        var isDuplicate = false;
        for (var i = 0; i < handles.length; i++) {
            if (await handles[i].isSameEntry(dir)) {
                isDuplicate = true;
                break;
            }
        }
        
        if (isDuplicate) {
            showToast('Folder already in library', 'warning');
            return;
        }
        
        handles.push(dir);
        await saveSetting('folderHandles', handles);
        await startScanning(handles);
    } catch(e) {
        if (e.name !== 'AbortError') {
            showToast('Error: ' + e.message, 'warning');
        }
    }
}

async function resumeSession() {
    try {
        var handles = await getSetting('folderHandles');
        if (!handles || handles.length === 0) {
            showToast('No saved session found', 'warning');
            return;
        }
        
        var grantedHandles = [];
        for (var i = 0; i < handles.length; i++) {
            try {
                var perm = await handles[i].requestPermission({ mode: 'read' });
                if (perm === 'granted') {
                    grantedHandles.push(handles[i]);
                }
            } catch(e) {}
        }
        
        if (grantedHandles.length > 0) {
            await saveSetting('folderHandles', grantedHandles);
            await startScanning(grantedHandles);
        } else {
            showToast('Permission denied. Please re-add folders.', 'warning');
        }
    } catch(e) {
        showToast('Error: ' + e.message, 'warning');
    }
}

async function startScanning(dirs) {
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('loadingOverlay').classList.remove('hidden');
    document.getElementById('loadingText').textContent = 'Scanning folders...';
    document.getElementById('loadingProgress').textContent = '';
    
    await scanFolders(dirs);
    
    document.getElementById('loadingOverlay').classList.add('hidden');
    document.getElementById('appContainer').classList.add('active');
    updateStats();
    filterMovies();
    showToast('Found ' + allMovies.length + ' movies', 'success');
}

async function scanFolders(dirs) {
    allMovies = [];
    skippedFolders = [];
    
    for (var d = 0; d < dirs.length; d++) {
        var dir = dirs[d];
        var entries = [];
        
        try {
            for await (var entry of dir.values()) {
                if (entry.kind === 'directory') {
                    entries.push(entry);
                }
            }
        } catch(e) {
            skippedFolders.push({ name: dir.name || 'Unknown', reason: 'Access denied' });
            continue;
        }
        
        var total = entries.length;
        for (var i = 0; i < entries.length; i++) {
            document.getElementById('loadingProgress').textContent = 
                'Path ' + (d+1) + '/' + dirs.length + ' | ' + (i + 1) + ' / ' + total;
            
            var r = await processMovieFolder(entries[i], dir.name);
            if (r.movie) {
                allMovies.push(r.movie);
            } else if (r.reason) {
                skippedFolders.push({ name: entries[i].name, reason: r.reason });
            }
        }
    }
    
    allMovies.sort(function(a, b) {
        return a.title.localeCompare(b.title);
    });
}

async function processMovieFolder(fh, rootName) {
    var match = fh.name.match(MOVIE_REGEX);
    if (!match) {
        return { reason: 'Name does not match "Movie (Year)"' };
    }
    
    var posterHandle = null, videoHandle = null, logoHandle = null, nfoHandle = null, fanartHandle = null;
    
    try {
        for await (var f of fh.values()) {
            if (f.kind !== 'file') continue;
            var lo = f.name.toLowerCase();
            
            if (VIDEO_EXTS.some(function(ext) { return lo.endsWith(ext); })) {
                if (!videoHandle) videoHandle = f;
            } else if (IMG_EXTS.some(function(ext) { return lo.endsWith(ext); })) {
                if (lo.includes('fanart') || lo.includes('-fanart.')) {
                    if (!fanartHandle) fanartHandle = f;
                } else if (lo.includes('clearlogo') || lo.includes('logo')) {
                    if (!logoHandle) logoHandle = f;
                } else if (lo.includes('poster') || lo.includes('folder') || lo.includes('cover')) {
                    if (!posterHandle) posterHandle = f;
                }
            }
            if (lo.endsWith('.nfo')) nfoHandle = f;
        }
    } catch(e) {
        return { reason: 'Access denied' };
    }
    
    if (!videoHandle) {
        return { reason: 'No video file' };
    }
    
    // Fallback: use any image as poster/fanart
    if (!posterHandle || !fanartHandle) {
        try {
            for await (var f2 of fh.values()) {
                if (f2.kind !== 'file' || !IMG_EXTS.some(function(ext) { 
                    return f2.name.toLowerCase().endsWith(ext); 
                })) continue;
                
                var lo2 = f2.name.toLowerCase();
                if (!posterHandle && !lo2.includes('fanart') && !lo2.includes('logo')) {
                    posterHandle = f2;
                }
                if (!fanartHandle && (lo2.includes('fanart') || lo2.includes('background') || lo2.includes('backdrop'))) {
                    fanartHandle = f2;
                }
            }
        } catch(e) {}
    }
    
    if (!posterHandle) {
        return { reason: 'No poster image' };
    }
    
    // Parse NFO
    var nfoData = null;
    if (nfoHandle) {
        try {
            var nf = await nfoHandle.getFile();
            var txt = await nf.text();
            nfoData = parseNFO(txt);
        } catch(e) {
            console.error('NFO read error:', e);
        }
    }
    
    // Get video file size
    var vf = await videoHandle.getFile();
    
    // Extract quality from filename
    var qm = videoHandle.name.match(/(\d{3,4}p|720p|1080p|2160p|4[kK]|HDR|Blu-?ray|WEB-?DL|WEBRip|HDTV)/i);
    
    return {
        movie: {
            title: match[1].trim(),
            year: match[2],
            posterHandle: posterHandle,
            videoHandle: videoHandle,
            logoHandle: logoHandle,
            fanartHandle: fanartHandle,
            hasNfo: !!nfoHandle,
            quality: qm ? qm[1] : '',
            fileSize: vf.size,
            fileName: videoHandle.name,
            relativePath: rootName + '/' + fh.name,
            posterUrl: null,
            logoUrl: null,
            fanartUrl: null,
            nfoData: nfoData
        }
    };
}

// ── UI Updates ──
function updateStats() {
    var ts = allMovies.reduce(function(s, m) { return s + m.fileSize; }, 0);
    document.getElementById('headerStats').textContent = 
        allMovies.length + ' movies \u2022 ' + formatBytes(ts) + ' total';
    document.getElementById('skippedCount').textContent = skippedFolders.length;
    document.getElementById('skippedList').innerHTML = skippedFolders.map(function(s) {
        return '<li><strong>' + escHtml(s.name) + '</strong> \u2014 ' + escHtml(s.reason) + '</li>';
    }).join('');
}

function toggleSkippedPanel() {
    document.getElementById('skippedPanel').classList.toggle('active');
}

function filterMovies() {
    var q = document.getElementById('searchInput').value.toLowerCase().trim();
    var s = document.getElementById('sortSelect').value;
    
    filteredMovies = allMovies.filter(function(m) {
        if (!q) return true;
        if (m.title.toLowerCase().includes(q)) return true;
        if (m.year.includes(q)) return true;
        if (m.quality && m.quality.toLowerCase().includes(q)) return true;
        if (m.nfoData && m.nfoData.genres && m.nfoData.genres.some(function(g) { 
            return g.toLowerCase().includes(q); 
        })) return true;
        if (m.nfoData && m.nfoData.tags && m.nfoData.tags.some(function(t) { 
            return t.toLowerCase().includes(q); 
        })) return true;
        return false;
    });
    
    filteredMovies.sort(function(a, b) {
        if (s === 'name-asc') return a.title.localeCompare(b.title);
        if (s === 'name-desc') return b.title.localeCompare(a.title);
        if (s === 'year-asc') return parseInt(a.year) - parseInt(b.year);
        if (s === 'year-desc') return parseInt(b.year) - parseInt(a.year);
        if (s === 'rating-desc') {
            var ra = (a.nfoData && a.nfoData.rating) || 0;
            var rb = (b.nfoData && b.nfoData.rating) || 0;
            return rb - ra;
        }
        if (s === 'size-desc') return b.fileSize - a.fileSize;
        return 0;
    });
    
    renderMovies();
}

async function loadAssets() {
    var posters = document.querySelectorAll('.poster-img[data-idx]');
    var logos = document.querySelectorAll('.logo-img[data-idx]');
    var promises = [];
    
    for (var i = 0; i < posters.length; i++) {
        (function(img) {
            promises.push((async function() {
                var idx = parseInt(img.dataset.idx);
                var m = filteredMovies[idx];
                if (!m || !m.posterHandle) return;
                if (m.posterUrl) {
                    img.src = m.posterUrl;
                    img.classList.add('loaded');
                    return;
                }
                try {
                    var f = await m.posterHandle.getFile();
                    m.posterUrl = URL.createObjectURL(f);
                    img.src = m.posterUrl;
                    img.classList.add('loaded');
                } catch(e) {}
            })());
        })(posters[i]);
    }
    
    for (var j = 0; j < logos.length; j++) {
        (function(img) {
            promises.push((async function() {
                var idx = parseInt(img.dataset.idx);
                var m = filteredMovies[idx];
                if (!m || !m.logoHandle) return;
                if (m.logoUrl) {
                    img.src = m.logoUrl;
                    img.classList.add('loaded');
                    return;
                }
                try {
                    var f = await m.logoHandle.getFile();
                    m.logoUrl = URL.createObjectURL(f);
                    img.src = m.logoUrl;
                    img.classList.add('loaded');
                } catch(e) {}
            })());
        })(logos[j]);
    }
    
    await Promise.all(promises);
}

function renderMovies() {
    var c = document.getElementById('movieContainer');
    var e = document.getElementById('emptyState');
    
    document.getElementById('filterCount').textContent = 
        'Showing ' + filteredMovies.length + ' of ' + allMovies.length;
    
    if (filteredMovies.length === 0) {
        c.innerHTML = '';
        e.style.display = 'flex';
        return;
    }
    
    e.style.display = 'none';
    var h = '';
    
    if (currentView === 'grid') {
        h = '<div class="movie-grid">' + filteredMovies.map(function(m, i) {
            var r = m.nfoData && m.nfoData.rating;
            return '<div class="movie-card" onclick="showDetailPage(' + i + ')">' +
                '<div class="poster-container">' +
                    (m.logoHandle ? '<img class="logo-img" data-idx="' + i + '">' : '') +
                    '<img class="poster-img" data-idx="' + i + '">' +
                    '<div class="no-poster-placeholder">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                            '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
                            '<circle cx="8.5" cy="8.5" r="1.5"/>' +
                            '<path d="m21 15-5-5L5 21"/>' +
                        '</svg>' +
                    '</div>' +
                    '<div class="card-overlay">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                            '<circle cx="12" cy="12" r="10"/>' +
                            '<polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>' +
                        '</svg>' +
                    '</div>' +
                    (m.hasNfo ? '<span class="nfo-badge">NFO</span>' : '') +
                    (r ? '<div class="rating-badge">' +
                        '<svg width="12" height="12" viewBox="0 0 24 24" fill="var(--star-color)">' +
                            '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>' +
                        '</svg>' + r.toFixed(1) +
                    '</div>' : '') +
                '</div>' +
                '<div class="card-info">' +
                    '<div class="movie-title">' + escHtml(m.title) + '</div>' +
                    '<div class="movie-year">' + m.year + 
                        (m.nfoData && m.nfoData.runtime ? ' \u2022 ' + m.nfoData.runtime + 'm' : '') + 
                    '</div>' +
                    (m.quality ? '<span class="movie-quality">' + escHtml(m.quality) + '</span>' : '') +
                    (m.nfoData && m.nfoData.genres && m.nfoData.genres.length ? 
                        '<div class="movie-genre">' + m.nfoData.genres.map(escHtml).join(', ') + '</div>' : '') +
                    '<div class="movie-filesize">' + formatBytes(m.fileSize) + '</div>' +
                '</div>' +
            '</div>';
        }).join('') + '</div>';
    } else if (currentView === 'detail') {
        h = '<div class="movie-detail-grid">' + filteredMovies.map(function(m, i) {
            return '<div class="movie-detail-card" onclick="showDetailPage(' + i + ')">' +
                '<div class="detail-poster">' +
                    '<img class="poster-img" data-idx="' + i + '">' +
                '</div>' +
                '<div class="detail-info">' +
                    '<div class="detail-title">' + escHtml(m.title) + '</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:.3rem">' + m.year + 
                        (m.nfoData && m.nfoData.runtime ? ' \u2022 ' + m.nfoData.runtime + ' min' : '') + 
                    '</div>' +
                    (m.nfoData && m.nfoData.rating ? 
                        '<div style="display:flex;align-items:center;gap:.3rem;margin-bottom:.5rem;color:var(--star-color)">' +
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--star-color)">' +
                                '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>' +
                            '</svg>' +
                            '<strong>' + m.nfoData.rating.toFixed(1) + '</strong>' +
                            '<span style="color:var(--text-muted)">(' + 
                                (m.nfoData.ratingVotes ? m.nfoData.ratingVotes.toLocaleString() : '?') + 
                            ')</span>' +
                        '</div>' : '') +
                    '<div class="detail-tags">' +
                        (m.quality ? '<span class="detail-tag">' + escHtml(m.quality) + '</span>' : '') +
                        '<span class="detail-tag">' + formatBytes(m.fileSize) + '</span>' +
                        (m.nfoData && m.nfoData.genres ? 
                            m.nfoData.genres.slice(0, 2).map(function(g) { 
                                return '<span class="detail-tag">' + escHtml(g) + '</span>'; 
                            }).join('') : '') +
                    '</div>' +
                    '<div class="detail-filename" title="' + escHtml(m.fileName) + '">' + 
                        escHtml(m.fileName) + 
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('') + '</div>';
    } else {
        h = '<div class="movie-list">' + filteredMovies.map(function(m, i) {
            return '<div class="movie-list-item" onclick="showDetailPage(' + i + ')">' +
                '<div class="list-poster">' +
                    '<img class="poster-img" data-idx="' + i + '">' +
                '</div>' +
                '<div class="list-info">' +
                    '<div class="list-title">' + escHtml(m.title) + '</div>' +
                    '<div class="list-meta">' +
                        '<span>' + m.year + '</span>' +
                        (m.quality ? '<span>' + escHtml(m.quality) + '</span>' : '') +
                        (m.nfoData && m.nfoData.runtime ? '<span>' + m.nfoData.runtime + 'm</span>' : '') +
                        (m.nfoData && m.nfoData.rating ? 
                            '<span style="color:var(--star-color)">\u2605 ' + m.nfoData.rating.toFixed(1) + '</span>' : '') +
                        '<span>' + formatBytes(m.fileSize) + '</span>' +
                    '</div>' +
                '</div>' +
                '<svg class="list-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<polyline points="9 18 15 12 9 6"/>' +
                '</svg>' +
            '</div>';
        }).join('') + '</div>';
    }
    
    c.innerHTML = h;
    loadAssets();
}

// ── Detail Page ──
async function showDetailPage(idx) {
    var m = filteredMovies[idx];
    if (!m) return;
    
    // Load poster
    if (!m.posterUrl && m.posterHandle) {
        try {
            var f = await m.posterHandle.getFile();
            m.posterUrl = URL.createObjectURL(f);
        } catch(e) {}
    }
    
    // Load fanart
    var fanartSrc = '';
    if (m.fanartHandle) {
        if (!m.fanartUrl) {
            try {
                var ff = await m.fanartHandle.getFile();
                m.fanartUrl = URL.createObjectURL(ff);
            } catch(e) {}
        }
        if (m.fanartUrl) fanartSrc = m.fanartUrl;
    }
    if (!fanartSrc && m.nfoData && m.nfoData.onlineFanart) {
        fanartSrc = m.nfoData.onlineFanart;
    }
    
    document.getElementById('detailPageBg').style.backgroundImage = 
        fanartSrc ? 'url(' + fanartSrc + ')' : 'none';
    
    var nfo = m.nfoData || {};
    var body = document.getElementById('detailPageBody');
    
    var html = '<div class="detail-hero">' +
        '<div class="detail-hero-poster">' +
            (m.posterUrl ? '<img src="' + m.posterUrl + '">' : '') +
        '</div>' +
        '<div class="detail-hero-info">' +
            '<h1 class="detail-hero-title">' + escHtml(m.title) + '</h1>' +
            '<div class="detail-hero-subtitle">' +
                '<span>' + m.year + '</span>' +
                (nfo.runtime ? '<span>' + nfo.runtime + ' min</span>' : '') +
                (nfo.certification && nfo.certification !== 'NR' ? '<span>' + escHtml(nfo.certification) + '</span>' : '') +
                (nfo.premiered ? '<span>' + escHtml(nfo.premiered) + '</span>' : '') +
            '</div>';
    
    if (nfo.rating) {
        html += '<div class="detail-hero-rating">' +
            '<span class="detail-hero-rating-val">\u2605 ' + nfo.rating.toFixed(1) + '</span>' +
            '<div class="detail-hero-rating-bar">' +
                '<div class="detail-hero-rating-fill" style="width:' + (nfo.rating * 10) + '%"></div>' +
            '</div>' +
            (nfo.ratingVotes ? '<span class="detail-hero-rating-votes">' + nfo.ratingVotes.toLocaleString() + ' votes</span>' : '') +
        '</div>';
    }
    
    html += '<div class="detail-hero-actions">' +
        '<button class="detail-play-btn" onclick="playMovie(' + idx + ')">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>' +
            'Play Movie' +
        '</button>' +
        '<button class="detail-secondary-btn" onclick="copyMoviePath(' + idx + ')">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
                '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
            '</svg>' +
            'Copy Path' +
        '</button>' +
    '</div></div></div>';
    
    if (nfo.tagline) {
        html += '<div class="detail-tagline">\u201C' + escHtml(nfo.tagline) + '\u201D</div>';
    }
    
    if (nfo.genres && nfo.genres.length) {
        html += '<div class="detail-genres">' + 
            nfo.genres.map(function(g) { 
                return '<span class="detail-genre-pill">' + escHtml(g) + '</span>'; 
            }).join('') + 
        '</div>';
    }
    
    if (nfo.plot) {
        html += '<div class="detail-section">' +
            '<div class="detail-section-title">Synopsis</div>' +
            '<p class="detail-plot">' + escHtml(nfo.plot) + '</p>' +
        '</div>';
    }
    
    html += '<div class="detail-section">' +
        '<div class="detail-section-title">Information</div>' +
        '<div class="detail-meta-grid">';
    
    if (nfo.directors && nfo.directors.length) {
        html += '<div class="detail-meta-item">' +
            '<span class="detail-meta-label">Director</span>' +
            '<span class="detail-meta-value">' + escHtml(nfo.directors.join(', ')) + '</span>' +
        '</div>';
    }
    if (nfo.writers && nfo.writers.length) {
        html += '<div class="detail-meta-item">' +
            '<span class="detail-meta-label">Writer</span>' +
            '<span class="detail-meta-value">' + escHtml(nfo.writers.join(', ')) + '</span>' +
        '</div>';
    }
    if (nfo.studio) {
        html += '<div class="detail-meta-item">' +
            '<span class="detail-meta-label">Studio</span>' +
            '<span class="detail-meta-value">' + escHtml(nfo.studio) + '</span>' +
        '</div>';
    }
    if (nfo.country) {
        html += '<div class="detail-meta-item">' +
            '<span class="detail-meta-label">Country</span>' +
            '<span class="detail-meta-value">' + escHtml(nfo.country) + '</span>' +
        '</div>';
    }
    if (nfo.source) {
        html += '<div class="detail-meta-item">' +
            '<span class="detail-meta-label">Source</span>' +
            '<span class="detail-meta-value">' + escHtml(nfo.source) + '</span>' +
        '</div>';
    }
    if (m.quality) {
        html += '<div class="detail-meta-item">' +
            '<span class="detail-meta-label">Quality</span>' +
            '<span class="detail-meta-value">' + escHtml(m.quality) + '</span>' +
        '</div>';
    }
    
    html += '<div class="detail-meta-item">' +
        '<span class="detail-meta-label">File Size</span>' +
        '<span class="detail-meta-value">' + formatBytes(m.fileSize) + '</span>' +
    '</div>' +
    '<div class="detail-meta-item">' +
        '<span class="detail-meta-label">Filename</span>' +
        '<span class="detail-meta-value">' + escHtml(m.fileName) + '</span>' +
    '</div>';
    
    if (nfo.imdbId) {
        html += '<div class="detail-meta-item">' +
            '<span class="detail-meta-label">IMDb</span>' +
            '<span class="detail-meta-value">' +
                '<a href="https://www.imdb.com/title/' + escHtml(nfo.imdbId) + '" target="_blank">' + 
                    escHtml(nfo.imdbId) + 
                '</a>' +
            '</span>' +
        '</div>';
    }
    if (nfo.tmdbId) {
        html += '<div class="detail-meta-item">' +
            '<span class="detail-meta-label">TMDb</span>' +
            '<span class="detail-meta-value">' +
                '<a href="https://www.themoviedb.org/movie/' + escHtml(nfo.tmdbId) + '" target="_blank">' + 
                    escHtml(nfo.tmdbId) + 
                '</a>' +
            '</span>' +
        '</div>';
    }
    
    html += '</div></div>';
    
    // Technical specs
    if (nfo.videoCodec || nfo.audioCodec) {
        html += '<div class="detail-section">' +
            '<div class="detail-section-title">Technical Specs</div>' +
            '<div class="detail-tech">';
        
        if (nfo.videoCodec) {
            html += '<div class="detail-tech-item">' +
                '<div class="detail-tech-label">Video Codec</div>' +
                '<div class="detail-tech-value">' + escHtml(nfo.videoCodec) + '</div>' +
            '</div>';
        }
        if (nfo.videoResolution) {
            html += '<div class="detail-tech-item">' +
                '<div class="detail-tech-label">Resolution</div>' +
                '<div class="detail-tech-value">' + escHtml(nfo.videoResolution) + '</div>' +
            '</div>';
        }
        if (nfo.videoAspect) {
            html += '<div class="detail-tech-item">' +
                '<div class="detail-tech-label">Aspect Ratio</div>' +
                '<div class="detail-tech-value">' + escHtml(nfo.videoAspect) + '</div>' +
            '</div>';
        }
        if (nfo.audioCodec) {
            html += '<div class="detail-tech-item">' +
                '<div class="detail-tech-label">Audio Codec</div>' +
                '<div class="detail-tech-value">' + escHtml(nfo.audioCodec) + '</div>' +
            '</div>';
        }
        if (nfo.audioChannels) {
            html += '<div class="detail-tech-item">' +
                '<div class="detail-tech-label">Audio Channels</div>' +
                '<div class="detail-tech-value">' + escHtml(nfo.audioChannels) + ' ch</div>' +
            '</div>';
        }
        
        html += '</div></div>';
    }
    
    // Tags
    if (nfo.tags && nfo.tags.length) {
        html += '<div class="detail-section">' +
            '<div class="detail-section-title">Tags</div>' +
            '<div class="detail-tags">' + 
                nfo.tags.map(function(t) { 
                    return '<span class="detail-tag-sm">' + escHtml(t) + '</span>'; 
                }).join('') + 
            '</div>' +
        '</div>';
    }
    
    // Cast
    if (nfo.actors && nfo.actors.length) {
        html += '<div class="detail-section">' +
            '<div class="detail-section-title">Cast</div>' +
            '<div class="detail-cast-scroll">' +
                nfo.actors.map(function(a) {
                    return '<div class="detail-cast-card">' +
                        '<div class="detail-cast-avatar">' +
                            (a.thumb ? 
                                '<img src="' + escHtml(a.thumb) + '" onerror="this.parentElement.innerHTML=\'&#127917;\'">' : 
                                '&#127917;') +
                        '</div>' +
                        '<div class="detail-cast-name">' + escHtml(a.name) + '</div>' +
                        '<div class="detail-cast-role">' + escHtml(a.role) + '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
        '</div>';
    }
    
    body.innerHTML = html;
    
    var page = document.getElementById('detailPage');
    page.scrollTop = 0;
    requestAnimationFrame(function() {
        page.classList.add('active');
    });
}

function closeDetailPage() {
    document.getElementById('detailPage').classList.remove('active');
}

async function copyMoviePath(idx) {
    var m = filteredMovies[idx];
    if (!m) return;
    try {
        await navigator.clipboard.writeText(m.relativePath);
        showToast('Path copied to clipboard', 'success');
    } catch(e) {
        showToast('Failed to copy path', 'warning');
    }
}

// ── Video Player ──
async function playMovie(idx) {
    if (idx < 0 || idx >= filteredMovies.length) return;
    
    currentMovieIndex = idx;
    var m = filteredMovies[idx];
    
    try {
        var f = await m.videoHandle.getFile();
        var url = URL.createObjectURL(f);
        var vid = document.getElementById('videoPlayer');
        vid.src = url;
        vid.play();
        
        document.getElementById('playerTitle').textContent = m.title + ' (' + m.year + ')';
        document.getElementById('playerModal').classList.add('active');
        document.getElementById('prevBtn').disabled = idx === 0;
        document.getElementById('nextBtn').disabled = idx === filteredMovies.length - 1;
        
        closeDetailPage();
    } catch(e) {
        showToast('Error playing video: ' + e.message, 'warning');
    }
}

function closePlayer() {
    var v = document.getElementById('videoPlayer');
    v.pause();
    v.removeAttribute('src');
    v.load();
    document.getElementById('playerModal').classList.remove('active');
}

// ── Keyboard Shortcuts ──
document.addEventListener('keydown', function(e) {
    if (document.getElementById('playerModal').classList.contains('active')) {
        if (e.key === 'ArrowLeft') playMovie(currentMovieIndex - 1);
        if (e.key === 'ArrowRight') playMovie(currentMovieIndex + 1);
        if (e.key === 'Escape') closePlayer();
    } else if (document.getElementById('detailPage').classList.contains('active')) {
        if (e.key === 'Escape') closeDetailPage();
    }
});

// ── Initialization ──
window.addEventListener('DOMContentLoaded', function() {
    // Restore theme
    var savedTheme = localStorage.getItem('movieLibTheme') || 'netflix-dark';
    setTheme(savedTheme);
    
    // Check for saved session
    getSetting('folderHandles').then(function(handles) {
        if (handles && handles.length > 0) {
            document.getElementById('btnResume').classList.remove('hidden');
        }
    }).catch(function() {});
});
