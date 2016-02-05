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
