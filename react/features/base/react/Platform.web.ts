// @ts-ignore
const { userAgent, maxTouchPoints, platform } = navigator;
let OS = '';

if (userAgent.match(/Android/i)) {
    OS = 'android';
} else if (userAgent.match(/iP(ad|hone|od)/i) || (maxTouchPoints && maxTouchPoints > 2 && /MacIntel/.test(platform))) {
    OS = 'ios';
} else if (userAgent.match(/Mac(intosh| OS X)/i)) {
    OS = 'macos';
} else if (userAgent.match(/Windows/i)) {
    OS = 'windows';
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
