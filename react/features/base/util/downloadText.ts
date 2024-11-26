/**
 * Downloads a text string.
 *
 * @param {Object} text - The text to download.
 * @param {string} filename - The filename to give to the downloaded file.
 * @returns {void}
 */
export function downloadText(text: string, filename: string) {
    const elem = document.createElement('a');

    elem.download = filename;
    elem.href = `data:text/plain;charset=utf-8,\n${encodeURIComponent(text)}`;
    elem.dataset.downloadurl = [ 'text/plain', elem.download, elem.href ].join(':');
    elem.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: false
    }));
}
