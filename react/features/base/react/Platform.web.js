/* @flow */

const userAgent = navigator.userAgent;
let OS;

if (userAgent.match(/Android/i)) {
    OS = 'android';
} else if (userAgent.match(/iP(ad|hone|od)/i)) {
    OS = 'ios';
} else if (userAgent.match(/windows/i)) {
    OS = 'windows';
} else if (userAgent.match(/mac/i)) {
    OS = 'mac';
}

/**
 * Provides a minimal equivalent of react-native's Platform abstraction.
 */
export default {
    /**
     * The operating system on which the application is executing.
     *
     * @type {string}
     */
    OS
};
