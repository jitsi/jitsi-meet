// @flow
/**global APP */


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
function datetotime(timestamp=null){
    if(timestamp === null) {
        timestamp = new Date();
    }
    var options = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false,
      };
    let ye = new Intl.DateTimeFormat('en-US', options).format(timestamp);
   
    return `${ye}`;
}
export function downloadText(json: Object, filename: string) {
    var data = `Room \xa0 Name = ${APP.conference.roomName} \n Created  \xa0 at  \xa0 ${datetotime()} \n `;
    data += json.map( function(num,index) {
        const timestampToDate = num.timestamp ? new Date(num.timestamp) : new Date();
        return  `[${datetotime(num.timestamp)}] ${num.displayName}: ${num.message} \n `;
    }).join('');
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