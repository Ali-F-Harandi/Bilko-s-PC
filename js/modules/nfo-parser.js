// Movie Library - NFO Parser Module
// Parses XML NFO files for movie metadata

function parseNFO(xmlText) {
    var res = {
        rating: null, ratingVotes: null, plot: null, runtime: null,
        genres: [], tags: [], directors: [], writers: [], actors: [],
        certification: null, country: null, studio: null, tagline: null,
        imdbId: null, tmdbId: null, premiered: null, title: null,
        originaltitle: null, onlineFanart: null, source: null,
        videoCodec: null, videoResolution: null, videoAspect: null,
        audioCodec: null, audioChannels: null,
        setName: null, setOverview: null
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
        
        // Movie set/collection info
        var setEl = doc.querySelector('set');
        if (setEl) {
            var setNameEl = setEl.querySelector('name');
            var setOverviewEl = setEl.querySelector('overview');
            if (setNameEl) res.setName = setNameEl.textContent.trim();
            if (setOverviewEl) res.setOverview = setOverviewEl.textContent.trim();
        }
        
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

// Export for use in other modules
window.NFOParser = { parseNFO };
