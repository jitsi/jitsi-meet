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
