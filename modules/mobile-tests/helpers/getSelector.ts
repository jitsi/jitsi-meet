// @ts-ignore
const { ANDROID_DEVICE, IOS_DEVICE } = require('./constants');

/**
 * Return selector based on device type.
 *
 * @param {string} androidSelector - Selector for android devices
 * @param {string} iosSelector - Selector for ios devices
 * @returns {string} The selector
 */
export function getSelector(androidSelector: string, iosSelector: string) {
    let selector;

    if (IOS_DEVICE) {
        selector = iosSelector;
    } else if (ANDROID_DEVICE) {
        selector = androidSelector;
    } else {
        selector = undefined;
    }

    return selector;
}
