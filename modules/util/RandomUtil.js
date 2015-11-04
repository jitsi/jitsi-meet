/**
 * @const
 */
var ALPHANUM = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generates random int within the range [min, max]
 * @param min the minimum value for the generated number
 * @param max the maximum value for the generated number
 * @returns random int number
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array or string.
 * @param {Array|string} arr source
 * @returns array element or string character
 */
function randomElement(arr) {
    return arr[randomInt(0, arr.length -1)];
}

/**
 * Generate random alphanumeric string.
 * @param {number} length expected string length
 * @returns {string} random string of specified length
 */
function randomAlphanumStr(length) {
    var result = '';

    for (var i = 0; i < length; i += 1) {
        result += randomElement(ALPHANUM);
    }

    return result;
}

/**
 * Generates random hex number within the range [min, max]
 * @param min the minimum value for the generated number
 * @param max the maximum value for the generated number
 * @returns random hex number
 */
function rangeRandomHex(min, max)
{
    return randomInt(min, max).toString(16);
}

/**
 * Exported interface.
 */
var RandomUtil = {
    /**
     * Generates hex number with length 4
     */
    random4digitsHex: function () {
        return rangeRandomHex(0x1000, 0xFFFF);
    },
    /**
     * Generates hex number with length 8
     */
    random8digitsHex: function () {
        return rangeRandomHex(0x10000000, 0xFFFFFFFF);
    },
    /**
     * Generates hex number with length 12
     */
    random12digitsHex: function () {
        return rangeRandomHex(0x100000000000, 0xFFFFFFFFFFFF);
    }
};

module.exports = RandomUtil;
