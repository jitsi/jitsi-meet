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
    console.error(msg, e);
    if(window.onerror)
        window.onerror(msg, null, null,
            null, e);
}
