/* @flow */

declare var config: Object;

/**
 * Defines some utility methods that are used before lib-jitsi-meet and
 * jitsi-meet are loaded.
 */

/**
 * Builds and returns the room name.
 *
 * @returns {string}
 */
export function getRoomName(): string | typeof undefined {
    const { getroomnode } = config;
    const path = window.location.pathname;
    let roomName;

    // Determine the room node from the URL.
    if (getroomnode && typeof getroomnode === 'function') {
        // custom function might be responsible for doing the pushstate
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
export function getConfigParamsFromUrl(
        url: URL, dontParse: boolean = false, source: string = 'hash'): Object {
    let paramStr = source === 'search' ? url.search : url.hash;

    if (!paramStr) {
        return {};
    }

    paramStr = paramStr.substr(1);
    const result = {};

    paramStr.split('&').forEach(part => {
        const item = part.split('=');
        let value;

        try {
            value = dontParse ? item[1] : JSON.parse(
                decodeURIComponent(item[1]).replace(/\\&/, '&'));
        } catch (e) {
            console.warn('Failed to parse URL argument', e);

            if (window.onerror) {
                window.onerror('Failed to parse URL argument', null, null,
                    null, e);
            }

            return;
        }
        result[item[0]] = value;
    });

    return result;
}
