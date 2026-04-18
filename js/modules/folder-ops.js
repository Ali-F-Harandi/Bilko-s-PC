// Movie Library - Folder Operations Module
// Handles folder selection and session management

async function selectFolder() {
    if (!window.showDirectoryPicker) {
        window.Utils.showToast('Use Chrome or Edge browser', 'warning');
        return;
    }
    try {
        var dir = await window.showDirectoryPicker({ mode: 'read' });
        await window.DBUtils.saveSetting('folderHandles', [dir]);
        await startScanning([dir]);
    } catch(e) {
        document.getElementById('loadingOverlay').classList.add('hidden');
        if (e.name !== 'AbortError') {
            window.Utils.showToast('Error: ' + e.message, 'warning');
        }
    }
}

async function addFolder() {
    if (!window.showDirectoryPicker) {
        window.Utils.showToast('Use Chrome or Edge browser', 'warning');
        return;
    }
    try {
        var dir = await window.showDirectoryPicker({ mode: 'read' });
        var handles = await window.DBUtils.getSetting('folderHandles') || [];
        
        // Check for duplicates
        var isDuplicate = false;
        for (var i = 0; i < handles.length; i++) {
            if (await handles[i].isSameEntry(dir)) {
                isDuplicate = true;
                break;
            }
        }
        
        if (isDuplicate) {
            window.Utils.showToast('Folder already in library', 'warning');
            return;
        }
        
        handles.push(dir);
        await window.DBUtils.saveSetting('folderHandles', handles);
        await startScanning(handles);
    } catch(e) {
        if (e.name !== 'AbortError') {
            window.Utils.showToast('Error: ' + e.message, 'warning');
        }
    }
}

async function resumeSession() {
    try {
        var handles = await window.DBUtils.getSetting('folderHandles');
        if (!handles || handles.length === 0) {
            window.Utils.showToast('No saved session found', 'warning');
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
            await window.DBUtils.saveSetting('folderHandles', grantedHandles);
            await startScanning(grantedHandles);
        } else {
            window.Utils.showToast('Permission denied. Please re-add folders.', 'warning');
        }
    } catch(e) {
        window.Utils.showToast('Error: ' + e.message, 'warning');
    }
}

async function startScanning(dirs) {
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('loadingOverlay').classList.remove('hidden');
    document.getElementById('loadingText').textContent = 'Scanning folders...';
    document.getElementById('loadingProgress').textContent = '';
    
    await window.Scanner.scanFolders(dirs);
    
    document.getElementById('loadingOverlay').classList.add('hidden');
    document.getElementById('appContainer').classList.add('active');
    window.UIRenderer.updateStats();
    window.UIRenderer.filterMovies();
    window.Utils.showToast('Found ' + window.allMovies.length + ' movies', 'success');
}

// Export for use in other modules
window.FolderOps = { selectFolder, addFolder, resumeSession, startScanning };
