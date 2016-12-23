/**
 * Returns true if user agent is run on Android.
 *
 * @returns {boolean}
 */
export function detectAndroid() {
    return Boolean(navigator.userAgent.match(/Android/i));
}

/**
 * Returns true if user agent is run on iOS.
 *
 * @returns {boolean}
 */
export function detectIOS() {
    if (navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)) {
        return true;
    }

    return false;
}

/**
 * Transforms hash map with parameters to query string.
 *
 * @param {Object} params - Hash map to be processed into query string.
 * @returns {string}
 */
export function serializeQuery(params) {
    return Object.keys(params).reduce((str, key, index) => {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(params[key]);
        let separator = '&';

        if (index === 0) {
            separator = '?';
        }

        return `${str}${separator}${encodedKey}=${encodedValue}`;
    }, '');
}
