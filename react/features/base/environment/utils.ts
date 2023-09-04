import Platform from '../react/Platform';

/**
 * Returns whether or not the current environment is a mobile device.
 *
 * @returns {boolean}
 */
export function isMobileBrowser() {
    return Platform.OS === 'android' || Platform.OS === 'ios';
}


/**
 * Returns whether or not the current environment is an ios mobile device.
 *
 * @returns {boolean}
 */
export function isIosMobileBrowser() {
    return Platform.OS === 'ios';
}

