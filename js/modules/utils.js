// Movie Library - Utility Functions Module
// Common helper functions used throughout the app

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

// Export for use in other modules
window.Utils = { showToast, formatBytes, escHtml };
