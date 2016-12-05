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
 * Returns a random string of hex digits with length defined by argument.
 *
 * @param {number} length - The length of string.
 * @returns {string} Random hex string.
 */
export function randomHexString(length) {
    let result = '';

    for (let i = 0; i < length; i += 1) {
        result += randomHexDigit();
    }

    return result;
}

/**
 * Returns a random hex digit.
 *
 * @returns {Array|string}
 */
export function randomHexDigit() {
    return randomElement(HEX_DIGITS);
}

/**
 * Get random element from array of string.
 *
 * @param {Array|string} arr - Source.
 * @returns {Array|string} Array element or string character.
 */
export function randomElement(arr) {
    return arr[randomInt(0, arr.length - 1)];
}

/**
 * Generates random int within the range [min, max].
 *
 * @param {number} min - The minimum value for the generated number.
 * @param {number} max - The maximum value for the generated number.
 * @returns {number} Random int number.
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random alphanumeric string.
 *
 * @param {number} length - Expected string length.
 * @returns {string} Random string of specified length.
 */
export function randomAlphanumStr(length) {
    let result = '';

    for (let i = 0; i < length; i += 1) {
        result += randomElement(ALPHANUM);
    }

    return result;
}

