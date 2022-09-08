/**
 * Return selector based on device type.
 *
 * @param {Boolean} isAndroid - Check if device is Android type
 * @param {string} androidSelector - Selector for android devices
 * @param {string} iosSelector - Selector for ios devices
 * @returns {string} The selector
 */

module.exports = {
    getSelector(isAndroid, androidSelector, iosSelector) {
        return isAndroid ? androidSelector : iosSelector;
    }
};
