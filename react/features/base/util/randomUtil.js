/**
 * String consisting of alphanumeric characters
 * @const
 */
const ALPHANUM =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * String consisting of hexadecimal digits.
 * @const
 */
const HEX_DIGITS = '0123456789abcdef';

/**
 * Utility singleton responsible for generation of random sequences
 * @singleton
 */
export default const RandomUtil = {
    /**
     * Returns a random hex digit.
     * @returns {Array|string}
     */
    randomHexDigit: function() {
        return this.randomElement(HEX_DIGITS);
    },
    /**
     * Returns a random string of hex digits
     * with length defined by first argument.
     * @param {number} length - the length of string.
     */
    randomHexString: function (length) {
        let result = '';

        for (let i = 0; i < length; i += 1) {
          result += this.randomHexDigit();
        }

        return result;
    },

    /**
     * Generates random int within the range [min, max]
     * @param min the minimum value for the generated number
     * @param max the maximum value for the generated number
     * @returns {number} random int number
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Get random element from array or string.
     * @param {Array|string} arr source
     * @returns array element or string character
     */
    randomElement(arr) {
        return arr[this.randomInt(0, arr.length -1)];
    }

    /**
     * Generate random alphanumeric string.
     * @param {number} length expected string length
     * @returns {string} random string of specified length
     */
    randomAlphanumStr(length) {
        let result = '';

        for (var i = 0; i < length; i += 1) {
            result += this.randomElement(ALPHANUM);
        }

        return result;
    }
};
