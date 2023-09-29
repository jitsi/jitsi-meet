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
            const value = source[nextKey as keyof typeof source];

            if (typeof value !== 'undefined') {
                to[nextKey] = value;
            }
        }
    }

    return to;
}


/**
 * Creates a deferred object.
 *
 * @returns {{promise, resolve, reject}}
 */
export function createDeferred() {
    const deferred: any = {};

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
export function getBaseUrl(w: typeof window = window) {
    const doc = w.document;
    const base = doc.querySelector('base');

    if (base?.href) {
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
export function reportError(e: Error, msg = '') {
    console.error(msg, e);
    window.onerror?.(msg, undefined, undefined, undefined, e);
}

/**
 * Adds alpha to a color css string.
 *
 * @param {string} color - The color string either in rgb... Or #... Format.
 * @param {number} opacity -The opacity(alpha) to apply to the color. Can take a value between 0 and 1, including.
 * @returns {string} - The color with applied alpha.
 */
export function setColorAlpha(color: string, opacity: number) {
    if (!color) {
        return `rgba(0, 0, 0, ${opacity})`;
    }

    let b, g, r;

    try {
        if (color.startsWith('rgb')) {
            [ r, g, b ] = color.split('(')[1].split(')')[0].split(',').map(c => c.trim());
        } else if (color.startsWith('#')) {
            if (color.length === 4) {
                [ r, g, b ] = parseShorthandColor(color);
            } else {
                r = parseInt(color.substring(1, 3), 16);
                g = parseInt(color.substring(3, 5), 16);
                b = parseInt(color.substring(5, 7), 16);
            }
        } else {
            return color;
        }

        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } catch {
        return color;
    }
}

/**
 * Gets the hexa rgb values for a shorthand css color.
 *
 * @param {string} color -
 * @returns {Array<number>} - Array containing parsed r, g, b values of the color.
 */
function parseShorthandColor(color: string) {
    let b, g, r;

    r = color.substring(1, 2);
    r += r;
    r = parseInt(r, 16);

    g = color.substring(2, 3);
    g += g;
    g = parseInt(g, 16);

    b = color.substring(3, 4);
    b += b;
    b = parseInt(b, 16);

    return [ r, g, b ];
}

/**
 * Sorts an object by a sort function, same functionality as array.sort().
 *
 * @param {Object} object - The data object.
 * @param {Function} callback - The sort function.
 * @returns {void}
 */
export function objectSort(object: Object, callback: Function) {
    return Object.entries(object)
        .sort(([ , a ], [ , b ]) => callback(a, b))
        .reduce((row, [ key, value ]) => {
            return { ...row,
                [key]: value };
        }, {});
}
