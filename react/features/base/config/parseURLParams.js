/* @flow */

/**
 * Parses the parameters from the URL and returns them as a JS object.
 *
 * @param {string} url - URL to parse.
 * @param {boolean} dontParse - If false or undefined some transformations
 * (for parsing the value as JSON) are going to be executed.
 * @param {string} source - Values - "hash"/"search" if "search" the parameters
 * will parsed from location.search otherwise from location.hash.
 * @returns {Object}
 */
export default function parseURLParams(
        url: URL,
        dontParse: boolean = false,
        source: string = 'hash'): Object {
    const paramStr = source === 'search' ? url.search : url.hash;
    const params = {};

    // eslint-disable-next-line newline-per-chained-call
    paramStr && paramStr.substr(1).split('&').forEach(part => {
        const param = part.split('=');
        const key = param[0];

        if (!key) {
            return;
        }

        let value;

        try {
            value = param[1];
            if (!dontParse) {
                value
                    = JSON.parse(decodeURIComponent(value).replace(/\\&/, '&'));
            }
        } catch (e) {
            const msg = `Failed to parse URL parameter value: ${String(value)}`;

            console.warn(msg, e);
            window.onerror && window.onerror(msg, null, null, null, e);

            return;
        }
        params[key] = value;
    });

    return params;
}
