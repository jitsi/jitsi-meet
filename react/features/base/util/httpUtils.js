const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Wrapper around fetch GET requests to handle json-ifying the response
 * and logging errors.
 *
 * @param {string} url - The URL to perform a GET against.
 * @returns {Promise<Object>} The response body, in JSON format, will be
 * through the Promise.
 */
export function doGetJSON(url) {
    return fetch(url)
        .then(response => {
            const jsonify = response.json();

            if (response.ok) {
                return jsonify;
            }

            return jsonify
                .then(result => Promise.reject(result));
        })
        .catch(error => {
            logger.error('Error performing get:', url, error);

            return Promise.reject(error);
        });
}
