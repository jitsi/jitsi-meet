const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Create deferred object.
 *
 * @returns {{promise, resolve, reject}}
 */
export function createDeferred() {
    const deferred = {};

    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    return deferred;
}

/**
 * Reload page.
 */
export function reload() {
    window.location.reload();
}

/**
 * Redirects to a specific new URL by replacing the current location (in the
 * history).
 *
 * @param {string} url the URL pointing to the location where the user should
 * be redirected to.
 */
export function replace(url) {
    window.location.replace(url);
}

/**
 * Prints the error and reports it to the global error handler.
 *
 * @param e {Error} the error
 * @param msg {string} [optional] the message printed in addition to the error
 */
export function reportError(e, msg = '') {
    logger.error(msg, e);
    window.onerror && window.onerror(msg, null, null, null, e);
}
