const logger = require("jitsi-meet-logger").getLogger(__filename);

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
 * Creates a debounced function that delays invoking func until after wait
 * milliseconds have elapsed since the last time the debounced function was
 * invoked.
 *
 * @param fn
 * @param wait
 * @param options
 * @returns {function(...[*])}
 */
export function debounce(fn, wait = 0, options = {}) {
    const leading = options.leading || false;
    const trailing
        = (typeof options.trailing === 'undefined') || options.trailing;
    let called = false;

    return (...args) => {
        if (!called) {
            leading && fn(...args);

            setTimeout(() => {
                called = false;
                trailing && fn(...args);
            }, wait);

            called = true;
        }
    };
}

/**
 * Returns the namespace for all global variables, functions, etc that we need.
 *
 * @returns {Object} the namespace.
 *
 * NOTE: After React-ifying everything this should be the only global.
 */
export function getJitsiMeetGlobalNS() {
    if (!window.JitsiMeetJS) {
        window.JitsiMeetJS = {};
    }
    if (!window.JitsiMeetJS.app) {
        window.JitsiMeetJS.app = {};
    }
    return window.JitsiMeetJS.app;
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
export function reportError(e, msg = "") {
    logger.error(msg, e);
    window.onerror && window.onerror(msg, null, null, null, e);
}
