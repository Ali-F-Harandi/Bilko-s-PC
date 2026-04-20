# Bilko's Media Library

A fully client-side, zero-dependency media library browser for your local movie and TV show collection. Scan folders, browse posters, read metadata, and play videos — all inside the browser with no server required.

**Version 1.0.0 — First Original Release**

---

## Features

### Library Management
- **Folder scanning** via the File System Access API — select one or more media folders
- **Multi-folder support** — add and manage multiple library roots
- **Session persistence** — folder handles saved to IndexedDB; resume where you left off
- **Recent folders** — quick-access list of previously opened libraries
- **Drag & drop** — drop a folder on the welcome screen to get started

### Content Detection
- **Movies** — auto-detected from `Movie Name (Year)` folder naming
- **TV Shows** — detected by season sub-folders (`Season 1`, `S01`, etc.)
- **Animation** — content tagged with the "Animation" genre
- **Anime** — animation from Japan (auto-detected from genre + country)
- **Collections** — movies grouped by NFO `<set>` metadata (e.g. Marvel Cinematic Universe)
- **Skipped items** — folders that don't match patterns are listed with reasons

### View Modes (6 total)
| Mode | Description |
|------|-------------|
| **Grid** | Classic poster grid with hover effects and shine animation |
| **Detail** | Extended cards with ratings, tags, quality, and file info |
| **List** | Compact horizontal rows for quick scanning |
| **Compact** | Minimal cards with thumbnail + title |
| **Poster Wall** | Dense poster-only wall layout |
| **Table** | Spreadsheet-style with sortable columns |

### Tabs (10 total)
All · Movies · TV Shows · Animation · Anime · Collections · Favorites · History · Playlist · Stats

### Advanced Filters
- **Genre** — dropdown populated dynamically from your library's NFO data
- **Country** — filter by production country
- **Year range** — dual slider + number inputs (1900–2050)
- **File size** — min/max with GB/MB unit toggle
- **Rating** — minimum rating slider (0–10)
- **Sort** — name, year, rating, or file size (ascending/descending)
- **Active filter chips** — removable pills showing what's active
- **Filter indicator** — badge count on the filter button

### Rich Metadata Display
- Poster, fanart background, and clear-logo images
- NFO metadata: title, year, plot, tagline, rating, votes, runtime, certification
- Genres, tags, director, writers, cast with photos
- Technical specs: video codec, resolution, aspect ratio, audio codec, channels
- IMDb, TMDb, and TVDb links
- Collection/set information with "View Collection" link
- File size, quality badge, and filename display
- Local actor images from `.actors` sub-folder

### Professional Video Player
- **Multi-audio track** switching (languages, commentary)
- **Multi-subtitle** support: auto-detects .srt/.vtt/.ass/.ssa/.sub from movie folder
- **SRT → VTT conversion** for browser compatibility
- **Subtitle delay adjustment** (±0.5s increments) for out-of-sync subtitles
- **Subtitle font size** (Small / Medium / Large) with persistence
- **Playback speed** (0.5x – 2x) with persistence
- **Picture-in-Picture** mode
- **Fullscreen** mode
- **Resume playback** — auto-saves position; offers to resume on replay
- **Subtitle drag & drop** — drop a .srt/.vtt file onto the player to load it
- **25+ languages** auto-detected from subtitle filenames
- **Keyboard shortcuts** — C (subtitles), A (audio), F (fullscreen), M (mute), Shift+←/→ (±30s), Shift+↑/↓ (subtitle delay)

### Playlist
- Queue movies and TV shows for sequential playback
- Drag-and-drop reordering
- Play next / remove / clear

### Watch History
- Automatically recorded when you play a movie or episode
- Timeline view grouped by date
- Relative timestamps ("2h ago", "3d ago")

### Favorites
- Heart button on any card or detail page
- Dedicated Favorites tab

### Statistics
- Total titles, movies, TV shows, episodes, total size
- Genre, quality, file size, and decade distribution with animated bars
- Top rated and largest files lists

### Duplicate Finder
- Detects duplicate titles across your library folders

### Export
- Export library as **JSON**, **CSV**, or **TXT**

### Theme
- **Dark Mode** — deep black with red accent (#e50914)
- **Light Mode** — clean white with dark red accent (#c20008)
- Preference saved to localStorage

### PWA Support
- Service worker with cache-first strategy for static assets
- Installable as a standalone app
- Offline-capable for previously loaded content

### Performance
- **IntersectionObserver** lazy loading for poster images (loads 150px before viewport)
- **Debounced search** (250ms) to prevent excessive re-renders
- **IndexedDB thumbnail cache** — data URLs cached for 7 days
- **IndexedDB poster blob cache** — blobs cached for 24 hours with file-modification check
- **Infinite scroll** — loads items in pages (20/50/100/All) with append-based expansion
- **Skeleton loading** placeholders while content loads
- **CSS containment** — `contain: layout style paint` on cards for render optimization

### Keyboard Navigation
- **Arrow keys** — navigate between cards in grid/shelf views
- **Enter** — open focused card
- **Escape** — close detail page / player
- **Ctrl+K** — focus search
- **Ctrl+1–9** — switch tabs (1=All, 2=Movies, …, 0=Stats)
- **?** — toggle keyboard shortcuts help modal

---

## Getting Started

### Prerequisites
- **Chrome 86+** or **Edge 86+** (required for File System Access API)
- A local folder with movies/TV shows following the naming convention

### Quick Start
1. Open `index.html` in your browser (or serve via a local web server)
2. Click **Select Media Folder**
3. Choose a folder containing your movie/TV show collection
4. Browse, search, filter, and enjoy!

> ⚠️ **file:// protocol note**: Some features (IndexedDB, File System Access API) may not work on `file://`. Serve via a local web server for the best experience.

### Recommended Folder Structure

```
Media/
├── Movies/
│   ├── The Matrix (1999)/
│   │   ├── The Matrix (1999).mkv       # Video file
│   │   ├── poster.jpg                   # Movie poster
│   │   ├── The Matrix (1999)-fanart.jpg # Background image
│   │   ├── clearlogo.png                # Studio/logo image
│   │   ├── The Matrix (1999).nfo        # Metadata (Kodi XML)
│   │   ├── The Matrix (1999).en.srt     # English subtitles
│   │   └── .actors/
│   │       ├── Keanu_Reeves.jpg
│   │       └── Laurence_Fishburne.jpg
│   └── Inception (2010)/
│       ├── inception.mp4
│       └── poster.jpg
└── TV Shows/
    ├── Breaking Bad (2008)/
    │   ├── poster.jpg
    │   ├── fanart.jpg
    │   ├── tvshow.nfo
    │   ├── Season 1/
    │   │   ├── S01E01 - Pilot.mkv
    │   │   ├── S01E02 - Cat's in the Bag.mkv
    │   │   └── season01-poster.jpg
    │   └── Season 2/
    │       └── ...
    └── Game of Thrones (2011)/
        └── ...
```

### Image Naming Conventions

| Image Type | Movie | TV Show |
|-----------|-------|---------|
| **Poster** | `poster.jpg`, `folder.jpg`, `cover.jpg`, or any non-fanart image | `poster.jpg`, `folder.jpg`, `cover.jpg` |
| **Fanart** | `{name}-fanart.jpg` or any file containing "fanart" | `fanart.jpg` or any file containing "fanart" |
| **Logo** | `clearlogo.png` or any file containing "logo" | `clearlogo.png` or any file containing "logo" |
| **Season Poster** | N/A | `season01-poster.jpg`, `season02-poster.jpg`, etc. |

### Supported File Formats

| Type | Extensions |
|------|-----------|
| **Video** | .mp4, .mkv, .webm, .avi, .mov, .wmv, .flv, .m4v, .ts, .mpg, .mpeg |
| **Image** | .jpg, .jpeg, .png, .webp, .gif, .bmp |
| **Subtitle** | .srt, .vtt, .ass, .ssa, .sub |
| **Metadata** | .nfo (Kodi-compatible XML) |

---

## Project Structure

```
bilkos-media-library/
├── index.html                          # Main application HTML
├── manifest.json                       # PWA manifest
├── sw.js                               # Service worker (cache-first)
├── README.md                           # This file
├── css/
│   └── styles.css                      # Custom styles 
└── js/
    ├── main.js                         # Entry point: state, search, keyboard, init
    └── modules/
        ├── scanner.js                  # Folder scanning & movie/TV detection
        ├── ui-renderer.js              # Card rendering, view modes, tabs, filters
        ├── detail-page.js              # Movie & TV show detail pages
        ├── video-player.js             # Professional HTML5 video player
        ├── database.js                 # IndexedDB: settings, poster cache, thumbnails
        ├── nfo-parser.js               # Kodi NFO XML parser
        ├── theme.js                    # Dark/Light theme switching
        ├── favorites.js                # Favorites + random pick
        ├── watch-history.js            # Watch history tracking
        ├── playlist.js                 # Playlist queue with drag reordering
        ├── stats.js                    # Library statistics & visualizations
        ├── collections.js              # Movie collections/series grouping
        ├── duplicate-finder.js         # Duplicate title detection
        ├── folder-ops.js               # Folder add/remove/manage
        ├── export.js                   # Library export (JSON/CSV/TXT)
        ├── playback-resume.js          # Resume playback from saved position
        ├── debug.js                    # Debug utilities
        └── utils.js                    # Utility functions (formatting, escaping, toasts)
```

### Module Descriptions

#### `main.js` — Application Entry Point
Global state management, page size with infinite scroll, welcome screen stats, recent folders, genre/country filter handlers, context menu, debounced search, lazy loading observer, keyboard grid navigation, scroll-to-top, keyboard shortcuts help modal, and DOMContentLoaded initialization.

#### `scanner.js` — Folder Scanner
Uses the File System Access API to scan directories. Detects movies from `Name (Year)` folders and TV shows from season sub-folders. Extracts video files, poster/fanart/logo images, NFO metadata, quality info from filenames, and actor images from `.actors` sub-folders. Centralized poster loading with two-tier IndexedDB cache (data URL thumbnails + blob cache).

#### `ui-renderer.js` — UI Renderer
Renders content across all tabs in 6 view modes. Manages poster/logo lazy loading via IntersectionObserver, infinite scroll sentinel, shelf rows (Continue Watching, Recently Added, Top Rated), sort/filter/search logic, and dynamic Animation/Anime tab visibility.

#### `detail-page.js` — Detail Pages
Full-page detail views with fanart background. Movie detail: poster, metadata, play/copy/favorite/playlist actions, synopsis, info grid, tech specs, tags, cast with local actor images. TV show detail: season tabs, episode list, season poster, play episode, show information.

#### `video-player.js` — Video Player (v3.0)
Professional HTML5 player with multi-audio, multi-subtitle, subtitle delay, subtitle size, playback speed, PiP, fullscreen, resume, SRT→VTT conversion, language auto-detection, subtitle drag & drop, and keyboard shortcuts.

#### `database.js` — IndexedDB Storage
Three object stores: `settings` (key-value), `posterCache` (blob cache, 24h TTL), `thumbnails` (data URL cache, 7d TTL). Handles DB version upgrades and deletion/retry on version mismatch.

#### `nfo-parser.js` — NFO Metadata Parser
Parses Kodi-compatible XML NFO files for both movies and TV shows. Extracts: title, plot, rating, votes, runtime, certification, genres, tags, directors, writers, actors (with thumbnails), studio, country, IMDb/TMDb/TVDb IDs, technical specs, set/collection info, season plots, and online fanart URLs.

#### `theme.js` — Theme Manager
Dark/Light mode switching. Updates `data-theme` attribute on `<html>`, persists preference to localStorage.

#### `favorites.js` — Favorites
Toggle favorite status on any title. Favorites tab with search/sort. Random pick ("I'm Feeling Lucky") feature.

#### `watch-history.js` — Watch History
Records playback events with timestamps. History tab with timeline view, relative time formatting, clear all.

#### `playlist.js` — Playlist Queue
Add/remove items, drag-and-drop reordering, play next, clear all. Order preserved in localStorage.

#### `stats.js` — Library Statistics
Overview cards (total, movies, TV shows, episodes, size, avg rating). Animated horizontal bars for genre, quality, file size, and decade distributions. Top rated and largest files lists.

#### `collections.js` — Collections
Groups movies by NFO `<set>` name. Collections grid with poster collage, collection detail view showing all movies in the set.

#### `duplicate-finder.js` — Duplicate Finder
Detects movies with identical titles across different folders.

#### `folder-ops.js` — Folder Operations
Add, remove, and manage library folders. Absolute path configuration. Clear thumbnail cache.

#### `export.js` — Export
Export library data as JSON (full metadata), CSV (tabular), or TXT (plain text list).

#### `playback-resume.js` — Resume Playback
Saves video position on pause/close. Offers to resume when replaying. Clears position on video completion.

#### `utils.js` — Utilities
HTML escaping, file size formatting, toast notifications, debounce helper, clipboard fallback, lightbox.

---

## Keyboard Shortcuts

### Navigation
| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | All tab |
| `Ctrl+2` | Movies tab |
| `Ctrl+3` | TV Shows tab |
| `Ctrl+4` | Animation tab |
| `Ctrl+5` | Anime tab |
| `Ctrl+6` | Collections tab |
| `Ctrl+7` | Favorites tab |
| `Ctrl+8` | History tab |
| `Ctrl+9` | Playlist tab |
| `Ctrl+0` | Stats tab |
| `Ctrl+K` | Focus search |
| `?` | Show keyboard shortcuts help |
| `←` `→` `↑` `↓` | Navigate between cards |
| `Enter` | Open focused card |
| `Escape` | Close detail page / player / modal |

### Video Player
| Shortcut | Action |
|----------|--------|
| `C` | Cycle subtitles |
| `A` | Cycle audio tracks |
| `F` | Toggle fullscreen |
| `M` | Toggle mute |
| `Shift+←` | Seek −30s |
| `Shift+→` | Seek +30s |
| `Shift+↑` | Subtitle delay −0.5s |
| `Shift+↓` | Subtitle delay +0.5s |

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | Vanilla JavaScript (ES6+), no build step |
| **UI Framework** | Bootstrap 5.3.8 (CSS + JS bundle) |
| **Styling** | CSS Custom Properties (dark/light themes) |
| **Storage** | IndexedDB (folder handles, poster cache, thumbnails) |
| **Persistence** | localStorage (theme, view, page size, favorites, history, playlist) |
| **File Access** | File System Access API (Chrome/Edge) |
| **Offline** | Service Worker (cache-first for static assets) |
| **Images** | Object URLs + data URL caching for performance |
| **Icons** | Inline SVG (no external icon library) |

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 86+ | ✅ Full | File System Access API supported |
| Edge 86+ | ✅ Full | Chromium-based, full support |
| Firefox | ⚠️ Limited | No File System Access API |
| Safari | ⚠️ Limited | No File System Access API |
| file:// | ⚠️ Partial | IndexedDB may not work; use a web server |

---

## Privacy & Security

- **No data upload** — everything stays on your local machine
- **No tracking** — zero analytics or telemetry
- **No server** — runs entirely in the browser
- **Permission-based** — explicit user permission required for each folder
- **No cookies** — uses localStorage and IndexedDB only
- **No external requests** — all resources are local

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

**Bilko's Media Library** v1.0.0
