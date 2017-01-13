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
    return Boolean(navigator.userAgent.match(/iP(ad|hone|od)/i));
}
