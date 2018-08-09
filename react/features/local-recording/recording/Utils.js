/**
 * Force download of Blob in browser by faking an <a> tag.
 *
 * @param {Blob} blob - Base64 URL.
 * @param {string} fileName - The filename to appear in the download dialog.
 * @returns {void}
 */
export function downloadBlob(blob, fileName = 'recording.ogg') {
    const base64Url = window.URL.createObjectURL(blob);

    // fake a anchor tag
    const a = document.createElement('a');

    a.style = 'display: none';
    a.href = base64Url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
