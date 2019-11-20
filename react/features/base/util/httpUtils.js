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
 * @returns {Promise<Object>} The response body, in JSON format, will be
 * through the Promise.
 */
export function doGetJSON(url, retry) {
    const fetchPromise = fetch(url)
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
