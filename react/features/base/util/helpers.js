/**
 * Returns the namespace for all global variables, functions, etc that we need.
 *
 * @returns {Object} The namespace.
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
 * Makes the given promise fail with a timeout error if it wasn't fulfilled in
 * the given timeout.
 *
 * @param {Promise} promise - The promise which will be wrapped for timeout.
 * @param {number} ms - The amount of milliseconds to wait for a response before
 * failing with a timeout error.
 * @returns {Promise} - The wrapped promise.
 */
export function timeoutPromise(promise, ms) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('timeout'));
        }, ms);

        promise.then(
            res => {
                clearTimeout(timeoutId);
                resolve(res);
            },
            err => {
                clearTimeout(timeoutId);
                reject(err);
            }
        );
    });
}
