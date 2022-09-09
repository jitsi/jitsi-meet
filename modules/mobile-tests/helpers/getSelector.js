/**
 * Return selector based on device type.
 *
 * @param {Object} driver - Driver aka browser object where the tests run
 * @param {Object} selector - Selector object.
 * @returns {string} The selector
 */

module.exports = {
    getSelector(driver, selector) {
        return driver?.isAndroid ? selector?.android : selector?.ios;
    }
};
