/* @flow */

declare var config: Object;

/**
 * Builds and returns the room name.
 *
 * @returns {string}
 */
export function getRoomName(): ?string {
    const { getroomnode } = config;
    const path = window.location.pathname;
    let roomName;

    // Determine the room node from the URL.
    if (getroomnode && typeof getroomnode === 'function') {
        roomName = getroomnode.call(config, path);
    } else {
        // Fall back to the default strategy of making assumptions about how the
        // URL maps to the room (name). It currently assumes a deployment in
        // which the last non-directory component of the path (name) is the
        // room.
        roomName
            = path.substring(path.lastIndexOf('/') + 1).toLowerCase()
                || undefined;
    }

    return roomName;
}

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
export function parseURLParams(
        url: URL,
        dontParse: boolean = false,
        source: string = 'hash'): Object {
    const paramStr = source === 'search' ? url.search : url.hash;
    const params = {};

    // eslint-disable-next-line newline-per-chained-call
    paramStr && paramStr.substr(1).split('&').forEach(part => {
        const param = part.split('=');
        let value;

        try {
            value = param[1];
            if (!dontParse) {
                value
                    = JSON.parse(
                        decodeURIComponent(param[1]).replace(/\\&/, '&'));
            }
        } catch (e) {
            const msg = `Failed to parse URL parameter value: ${String(value)}`;

            console.warn(msg, e);
            window.onerror && window.onerror(msg, null, null, null, e);

            return;
        }
        params[param[0]] = value;
    });

    return params;
}
