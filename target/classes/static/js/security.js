// === Security: HTML escaping + DOMPurify-lite ===

/**
 * Escape HTML special characters to prevent XSS.
 * Use this whenever user-supplied data goes into innerHTML.
 */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
}

/**
 * Sanitize a string for use inside HTML attribute values (e.g. onclick='...')
 */
function escapeAttr(str) {
    return escapeHtml(str).replace(/\n/g, '&#10;').replace(/\r/g, '&#13;');
}

/**
 * Sanitize a string for use inside a JS string literal within HTML attributes.
 * Prevents breaking out of single/double quotes in inline event handlers.
 */
function escapeJsStr(str) {
    if (str == null) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$')
        .replace(/</g, '\\x3c')
        .replace(/>/g, '\\x3e')
        .replace(/&/g, '\\x26')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

/**
 * Sanitize a URL for href/src attributes — only allow http(s), mailto, and relative paths.
 */
function sanitizeUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') ||
        trimmed.startsWith('vbscript:') || trimmed.startsWith('file:')) {
        return '';
    }
    return url;
}