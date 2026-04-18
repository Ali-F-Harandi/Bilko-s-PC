// Movie Library - Scanner Module
// Handles folder scanning and movie detection

var VIDEO_EXTS = ['.mp4','.mkv','.webm','.avi','.mov','.wmv','.flv','.m4v','.ts','.mpg','.mpeg'];
var IMG_EXTS = ['.jpg','.jpeg','.png','.webp','.gif','.bmp'];
var MOVIE_REGEX = /^(.+?)\s*\((\d{4})\)$/;

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
            nfoData = window.NFOParser.parseNFO(txt);
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

async function scanFolders(dirs) {
    window.allMovies = [];
    window.skippedFolders = [];
    
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
            window.skippedFolders.push({ name: dir.name || 'Unknown', reason: 'Access denied' });
            continue;
        }
        
        var total = entries.length;
        for (var i = 0; i < entries.length; i++) {
            document.getElementById('loadingProgress').textContent = 
                'Path ' + (d+1) + '/' + dirs.length + ' | ' + (i + 1) + ' / ' + total;
            
            var r = await processMovieFolder(entries[i], dir.name);
            if (r.movie) {
                window.allMovies.push(r.movie);
            } else if (r.reason) {
                window.skippedFolders.push({ name: entries[i].name, reason: r.reason });
            }
        }
    }
    
    window.allMovies.sort(function(a, b) {
        return a.title.localeCompare(b.title);
    });
}

// Export for use in other modules
window.Scanner = { processMovieFolder, scanFolders, VIDEO_EXTS, IMG_EXTS, MOVIE_REGEX };
