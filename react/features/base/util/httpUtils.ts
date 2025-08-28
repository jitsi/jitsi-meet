import base64js from 'base64-js';

import { timeoutPromise } from './timeoutPromise';

/**
 * The number of milliseconds before deciding that we need retry a fetch request.
 *
 * @type {number}
 */
const RETRY_TIMEOUT = 3000;

/**
 * Wrapper around fetch GET requests to handle json-ifying the response
 * and logging errors.
 *
 * @param {string} url - The URL to perform a GET against.
 * @param {?boolean} retry - Whether the request will be retried after short timeout.
 * @param {?Object} options - The request options.
 * @returns {Promise<Object>} The response body, in JSON format, will be
 * through the Promise.
 */
export function doGetJSON(url: string, retry?: boolean, options?: Object) {
    const fetchPromise = fetch(url, options)
        .then(response => {
            const jsonify = response.json();

            if (response.ok) {
                return jsonify;
            }

            return jsonify
                .then(result => Promise.reject(result));
        });

    if (retry) {
        return timeoutPromise(fetchPromise, RETRY_TIMEOUT)
            .catch(response => {
                if (response.status >= 400 && response.status < 500) {
                    return Promise.reject(response);
                }

                return timeoutPromise(fetchPromise, RETRY_TIMEOUT);
            });
    }

    return fetchPromise;
}

/**
 * Encodes strings to Base64URL.
 *
 * @param {any} data - The byte array to encode.
 * @returns {string}
 */
export const encodeToBase64URL = (data: string): string => base64js
    .fromByteArray(new window.TextEncoder().encode(data))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

/**
 * Decodes strings from Base64URL.
 *
 * @param {string} data - The byte array to decode.
 * @returns {string}
 */
export const decodeFromBase64URL = (data: string): string => {
    let s = data;

    // Convert from Base64URL to Base64.
    if (s.length % 4 === 2) {
        s += '==';
    } else if (s.length % 4 === 3) {
        s += '=';
    }

    s = s.replace(/-/g, '+').replace(/_/g, '/');

    // Convert Base64 to a byte array.
    return new window.TextDecoder().decode(base64js.toByteArray(s));
};
