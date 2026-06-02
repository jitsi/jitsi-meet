/**
 * Downloads a JSON object.
 *
 * @param {Object} json - The JSON object to download.
 * @param {string} filename - The filename to give to the downloaded file.
 * @returns {void}
 */
export function downloadJSON(json: Object, filename: string): void {
    const replacer = () => {
        const seen = new WeakSet();

        return (_: any, value: any) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[circular ref]';
                }
                seen.add(value);
            }

            return value;
        };
    };
    const data = encodeURIComponent(JSON.stringify(json, replacer(), '  '));

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
