/**
 * Downloads a JSON object.
 *
 * @param {Object} json - The JSON object to download.
 * @param {string} filename - The filename to give to the downloaded file.
 * @returns {void}
 */
export function downloadJSON(json: Object, filename: string) {
    const data = encodeURIComponent(JSON.stringify(json, null, '  '));

    const elem = document.createElement('a');

    elem.download = filename;
    elem.href = `data:application/json;charset=utf-8,\n${data}`;
    elem.dataset.downloadurl = [ 'text/json', elem.download, elem.href ].join(':');
    elem.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: false
    }));
}
