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
