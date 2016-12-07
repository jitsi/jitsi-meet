const logger = require("jitsi-meet-logger").getLogger(__filename);

/**
 * Create deferred object.
 * @returns {{promise, resolve, reject}}
 */
export function createDeferred () {
    let deferred = {};

    deferred.promise = new Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    return deferred;
}

/**
 * Reload page.
 */
export function reload () {
    window.location.reload();
}

/**
 * Redirects to new URL.
 * @param {string} url the URL pointing to the location where the user should
 * be redirected to.
 */
export function redirect (url) {
    window.location.replace(url);
}

/**
 * Prints the error and reports it to the global error handler.
 * @param e {Error} the error
 * @param msg {string} [optional] the message printed in addition to the error
 */
export function reportError (e, msg = "") {
    logger.error(msg, e);
    if(window.onerror)
        window.onerror(msg, null, null,
            null, e);
}

/**
 * Creates a debounced function that delays invoking func until after wait
 * milliseconds have elapsed since the last time the debounced
 * function was invoked
 * @param fn
 * @param wait
 * @param options
 * @returns {function(...[*])}
 */
export function debounce(fn, wait = 0, options = {}) {
    let leading = options.leading || false;
    let trailing = true;
    let isCalled = false;

    if (typeof options.trailing !== 'undefined') {
        trailing = options.trailing;
    }

    return (...args) => {
        if(!isCalled) {
            if (leading) {
                fn(...args);
            }

            setTimeout(() => {
                isCalled = false;
                if (trailing) {
                    fn(...args);
                }
            }, wait);

            isCalled = true;
        }
    };
}
