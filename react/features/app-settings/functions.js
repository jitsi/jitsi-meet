// @flow

import { parseStandardURIString } from '../base/util';

/**
 * Normalizes a URL entered by the user.
 * FIXME: Consider adding this to base/util/uri.
 *
 * @param {string} url - The URL to validate.
 * @returns {string|null} - The normalized URL, or null if the URL is invalid.
 */
export function normalizeUserInputURL(url: string) {
    /* eslint-disable no-param-reassign */

    if (url) {
        url = url.replace(/\s/g, '').toLowerCase();
        const urlRegExp = new RegExp('^(\\w+://)?(.+)$');
        const urlComponents = urlRegExp.exec(url);

        if (!urlComponents[1] || !urlComponents[1].startsWith('http')) {
            url = `https://${urlComponents[2]}`;
        }

        const parsedURI
            = parseStandardURIString(url);

        if (!parsedURI.host) {
            return null;
        }

        return parsedURI.toString();
    }

    return url;

    /* eslint-enable no-param-reassign */
}
