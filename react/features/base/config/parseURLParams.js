/* @flow */

import { reportError } from '../util';

/**
 * Parses the query/search or fragment/hash parameters out of a specific URL and
 * returns them as a JS object.
 *
 * @param {string} url - The URL to parse.
 * @param {boolean} dontParse - If falsy, some transformations (for parsing the
 * value as JSON) will be executed.
 * @param {string} source - If {@code 'search'}, the parameters will parsed out
 * of {@code url.search}; otherwise, out of {@code url.hash}.
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
            reportError(
                e, `Failed to parse URL parameter value: ${String(value)}`);

            return;
        }
        params[key] = value;
    });

    return params;
}
