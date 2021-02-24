// @flow

/**
 * A helper function that behaves similar to Object.assign, but only reassigns a
 * property in target if it's defined in source.
 *
 * @param {Object} target - The target object to assign the values into.
 * @param {Object} source - The source object.
 * @returns {Object}
 */
export function assignIfDefined(target: Object, source: Object) {
    const to = Object(target);

    for (const nextKey in source) {
        if (source.hasOwnProperty(nextKey)) {
            const value = source[nextKey];

            if (typeof value !== 'undefined') {
                to[nextKey] = value;
            }
        }
    }

    return to;
}

/**
 * Tries to copy a given text to the clipboard.
 * Returns true if the action succeeds.
 *
 * @param {string} textToCopy - Text to be copied.
 * @returns {boolean}
 */
export async function copyText(textToCopy: string) {
    let result;

    try {
        result = await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
        result = false;
    }

    return result;
}

/**
 * Creates a deferred object.
 *
 * @returns {{promise, resolve, reject}}
 */
export function createDeferred(): Object {
    const deferred = {};

    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    return deferred;
}

const MATCH_OPERATOR_REGEXP = /[|\\{}()[\]^$+*?.-]/g;

/**
 * Escape RegExp special characters.
 *
 * Based on https://github.com/sindresorhus/escape-string-regexp.
 *
 * @param {string} s - The regexp string to escape.
 * @returns {string}
 */
export function escapeRegexp(s: string) {
    if (typeof s !== 'string') {
        throw new TypeError('Expected a string');
    }

    return s.replace(MATCH_OPERATOR_REGEXP, '\\$&');
}

/**
 * Returns the base URL of the app.
 *
 * @param {Object} w - Window object to use instead of the built in one.
 * @returns {string}
 */
export function getBaseUrl(w: Object = window) {
    const doc = w.document;
    const base = doc.querySelector('base');

    if (base && base.href) {
        return base.href;
    }

    const { protocol, host } = w.location;

    return `${protocol}//${host}`;
}

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
 * Prints the error and reports it to the global error handler.
 *
 * @param {Error} e - The error object.
 * @param {string} msg - A custom message to print in addition to the error.
 * @returns {void}
 */
export function reportError(e: Object, msg: string = '') {
    console.error(msg, e);
    window.onerror && window.onerror(msg, null, null, null, e);
}
