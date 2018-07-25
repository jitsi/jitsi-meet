/**
 * Force download of Blob in browser by faking an <a> tag.
 *
 * @param {string} blob - Base64 URL.
 * @param {string} fileName - The filename to appear in the download dialog.
 * @returns {void}
 */
export function downloadBlob(blob, fileName = 'recording.ogg') {
    // fake a anchor tag
    const a = document.createElement('a');

    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = blob;
    a.download = fileName;
    a.click();
}

/**
 * Obtains a timestamp of now. Used in filenames.
 *
 * @returns {string}
 */
export function timestampString() {
    const timeStampInMs = window.performance
        && window.performance.now
        && window.performance.timing
        && window.performance.timing.navigationStart
        ? window.performance.now() + window.performance.timing.navigationStart
        : Date.now();

    return timeStampInMs.toString();
}
