// @ts-ignore
const { maxTouchPoints, platform, userAgent } = navigator;

let OS = '',
    isPad = false;

if (userAgent.match(/Android/i)) {
    OS = 'android';
} else if (userAgent.match(/iP(ad|hone|od)/i) || (maxTouchPoints && maxTouchPoints > 2 && /MacIntel/.test(platform))) {
    OS = 'ios';
} else if (userAgent.match(/iP(ad)/i)) {
    OS = 'ios';
    isPad = true;
} else if (userAgent.match(/Mac(intosh| OS X)/i)) {
    OS = 'macos';
} else if (userAgent.match(/Windows/i)) {
    OS = 'windows';
} else if (userAgent.match(/Linux/i)) {
    OS = 'linux';
}

/**
 * Provides a minimal equivalent of react-native's Platform abstraction.
 */
export default {
    /**
     * Returns a boolean which defines if device is an iPad.
     *
     * @type {boolean}
     */
    isPad,

    /**
     * The operating system on which the application is executing.
     *
     * @type {string}
     */
    OS,

    /**
     * The operating system version on which the application is executing.
     * This is intentionally set to undefined so we can tell mobile and mobile web
     * apart easier.
     *
     * @type {number|undefined}
     */
    Version: undefined
};
