// @flow

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
