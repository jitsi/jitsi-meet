// @flow

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
 * Gets the description of a specific {@code Symbol}.
 *
 * @param {Symbol} symbol - The {@code Symbol} to retrieve the description of.
 * @private
 * @returns {string} The description of {@code symbol}.
 */
export function getSymbolDescription(symbol: ?Symbol) {
    let description = symbol ? symbol.toString() : 'undefined';

    if (description.startsWith('Symbol(') && description.endsWith(')')) {
        description = description.slice(7, -1);
    }

    // The polyfill es6-symbol that we use does not appear to comply with the
    // Symbol standard and, merely, adds @@ at the beginning of the description.
    if (description.startsWith('@@')) {
        description = description.slice(2);
    }

    return description;
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
