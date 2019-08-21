// @flow

import logger from './logger';

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
 * Prints the error and reports it to the global error handler.
 *
 * @param {Error} e - The error object.
 * @param {string} msg - A custom message to print in addition to the error.
 * @returns {void}
 */
export function reportError(e: Object, msg: string = '') {
    logger.error(msg, e);
    window.onerror && window.onerror(msg, null, null, null, e);
}
