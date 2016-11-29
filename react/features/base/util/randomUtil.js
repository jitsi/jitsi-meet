/**
 * String consisting of alphanumeric characters
 * @const
 */
const ALPHANUM
= '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * String consisting of hexadecimal digits.
 * @const
 */
const HEX_DIGITS = '0123456789abcdef';

/**
 * Utility singleton responsible for generation of random sequences
 *
 * @singleton
 * @const
 */
const RandomUtil = {

    /**
     * Returns a random hex digit.
     *
     * @returns {Array|string}
     */
    randomHexDigit() {
        return this.randomElement(HEX_DIGITS);
    },

    /**
     * Returns a random string of hex digits with length defined by argument.
     *
     * @param {number} length - The length of string.
     * @returns {string} Random hex string.
     */
    randomHexString(length) {
        let result = '';

        for (let i = 0; i < length; i += 1) {
            result += this.randomHexDigit();
        }

        return result;
    },

    /**
     * Generates random int within the range [min, max].
     *
     * @param {number} min - The minimum value for the generated number.
     * @param {number} max - The maximum value for the generated number.
     * @returns {number} Random int number.
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Get random elemnt from array of string.
     *
     * @param {Array|string} arr - Source.
     * @returns {Array|string} Array element or string character.
     */
    randomElement(arr) {
        return arr[this.randomInt(0, arr.length - 1)];
    },

    /**
     * Generate random alphanumeric string.
     *
     * @param {number} length - Expected string length.
     * @returns {string} Random string of specified length.
     */
    randomAlphanumStr(length) {
        let result = '';

        for (let i = 0; i < length; i += 1) {
            result += this.randomElement(ALPHANUM);
        }

        return result;
    }
};

export default RandomUtil;
