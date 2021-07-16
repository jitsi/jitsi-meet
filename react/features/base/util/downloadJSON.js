// @flow

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

/**
 * Covert timestamp to date time .
 *
 * @param {string} timestamp - The timestamp.
 * @returns {void}
 */
function datetotime(timestamp = null) {
    let ttime = '';

    if (timestamp === null) {
        ttime = new Date();
    } else {
        ttime = timestamp;
    }

    const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    };
    const ye = new Intl.DateTimeFormat('en-US', options).format(ttime);

    return `${ye}`;
}

/**
 * Downloads a JSON object.
 *
 * @param {Object} json - The JSON object array to download.
 * @param {string} filename - The filename to give to the downloaded text file.
 * @param {string} roomName - The JSON object to download.
 * @returns {void}
 */
export function downloadText(json: Object, filename: string, roomName: string) {
    let data = `Room \xa0 Name = ${roomName} \n Created  \xa0 at  \xa0 ${datetotime()} \n `;

    data += json.map(num => `[${datetotime(num.timestamp)}] ${num.displayName}: ${num.message} \n `).join('');
    const elem = document.createElement('a');

    elem.download = filename;
    elem.href = `data:application/plain;charset=utf-8,\n${data}`;
    elem.dataset.downloadurl = [ 'text/plain', elem.download, elem.href ].join(':');
    elem.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: false
    }));
}
