import JitsiMeetJS from '../lib-jitsi-meet';
import Platform from '../react/Platform';

import { isMobileBrowser } from './utils';

const { browser } = JitsiMeetJS.util;

const DEFAULT_OPTIMAL_BROWSERS = [
    'chrome',
    'chromium',
    'electron',
    'firefox',
    'safari',
    'webkit'
];

const DEFAULT_UNSUPPORTED_BROWSERS: string[] = [];

const browserNameToCheck = {
    chrome: browser.isChrome.bind(browser),
    chromium: browser.isChromiumBased.bind(browser),
    electron: browser.isElectron.bind(browser),
    firefox: browser.isFirefox.bind(browser),
    safari: browser.isSafari.bind(browser),
    webkit: browser.isWebKitBased.bind(browser)
};

/**
 * Returns whether or not jitsi is optimized and targeted for the  provided
 * browser name.
 *
 * @param {string} browserName - The name of the browser to check.
 * @returns {boolean}
 */
export function isBrowsersOptimal(browserName: string) {
    return (interfaceConfig.OPTIMAL_BROWSERS || DEFAULT_OPTIMAL_BROWSERS)
        .includes(browserName);
}

/**
 * Returns whether or not the current OS is Mac.
 *
 * @returns {boolean}
 */
export function isMacOS() {
    return Platform.OS === 'macos';
}

/**
 * Returns whether or not the current OS is Windows.
 *
 * @returns {boolean}
 */
export function isWindows() {
    return Platform.OS === 'windows';
}

/**
 * Returns whether or not the current browser or the list of passed in browsers
 * is considered suboptimal. Suboptimal means it is a supported browser but has
 * not been explicitly listed as being optimal, possibly due to functionality
 * issues.
 *
 * @param {Array<string>} [browsers] - A list of browser names to check. Will
 * default to a whitelist.
 * @returns {boolean}
 */
export function isSuboptimalBrowser() {
    const optimalBrowsers
        = interfaceConfig.OPTIMAL_BROWSERS || DEFAULT_OPTIMAL_BROWSERS;

    return !_isCurrentBrowserInList(optimalBrowsers) && isSupportedBrowser();
}

/**
 * Returns whether or not the current browser should allow the app to display.
 * A supported browser is assumed to be able to support WebRtc.
 *
 * @returns {boolean}
 */
export function isSupportedBrowser() {
    if (navigator.product === 'ReactNative') {
        return false;
    }

    // Blacklists apply to desktop browsers only right now.
    if (!isMobileBrowser() && _isCurrentBrowserInList(
        interfaceConfig.UNSUPPORTED_BROWSERS || DEFAULT_UNSUPPORTED_BROWSERS
    )) {
        return false;
    }

    return isMobileBrowser() ? isSupportedMobileBrowser() : JitsiMeetJS.isWebRtcSupported();
}

/**
 * Returns whether or not the current environment is a supported
 * browser on a mobile device.
 *
 * @returns {boolean}
 */
export function isSupportedMobileBrowser() {
    return (Platform.OS === 'android' && browser.isSupportedAndroidBrowser())
        || (Platform.OS === 'ios' && browser.isSupportedIOSBrowser());
}

/**
 * Runs various browser checks to know if the current browser is found within
 * the list.
 *
 * @param {Array<string>} list - Browser names to check. The names should be
 * keys in {@link browserNameToCheck}.
 * @private
 * @returns {boolean}
 */
function _isCurrentBrowserInList(list: string[]) {
    return Boolean(list.find(browserName => {
        const checkFunction = browserNameToCheck[browserName as keyof typeof browserNameToCheck];

        return checkFunction ? checkFunction.call(browser) : false;
    }));
}
