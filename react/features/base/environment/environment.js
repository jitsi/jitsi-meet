// @flow

import JitsiMeetJS from '../lib-jitsi-meet';
import Platform from '../react/Platform';

import { isMobileBrowser } from './utils';

const { browser } = JitsiMeetJS.util;

const DEFAULT_OPTIMAL_BROWSERS = [];

// const DEFAULT_UNSUPPORTED_BROWSERS = [];
let checkedIsBrave = false;

const browserNameToCheck = {
    brave: () => checkedIsBrave,
    chrome: () => checkedIsBrave,
    chromium: browser.isChromiumBased.bind(browser),
    electron: browser.isElectron.bind(browser),
    firefox: browser.isFirefox.bind(browser),
    nwjs: browser.isNWJS.bind(browser),
    opera: browser.isOpera.bind(browser),
    safari: browser.isSafari.bind(browser)
};

declare var interfaceConfig: Object;

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
 * Resolves as true when browser is brave.
 *
 * @returns {Promise<boolean>}
 */
/* eslint-disable */
export async function isBrave(): Promise<boolean> {
    try {
        const nav: any = navigator;
        const isBraveCheck = await nav.brave.isBrave();

        return isBraveCheck;
    } catch (e) {
        return false;
    }
}
/* eslint-enable */

/**
 * Reverse sets the brave boolean to allow for a sync function.
 *
 * @param {boolean} externalBraveCheck - Whether or not the browser is brave.
 * @returns {void}
 */
export function receiveIsBraveCheck(externalBraveCheck: boolean) { // eslint-disable-line
    checkedIsBrave = externalBraveCheck;
}

/**
 * Returns whether or not the current browser is the Brave browser.
 *
 * @returns {boolean}
 */
export function isBraveBrowser() {
    return checkedIsBrave;
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


    if (checkedIsBrave) {
        // at present, only desktop browser supported
        return !isMobileBrowser();
    }

    return false;

/*
    // Blacklists apply to desktop browsers only right now.
    if (!isMobileBrowser() && _isCurrentBrowserInList(
        interfaceConfig.UNSUPPORTED_BROWSERS || DEFAULT_UNSUPPORTED_BROWSERS
    )) {
        return false;
    }

    // We are intentionally allow mobile browsers because:
    // - the WelcomePage is mobile ready;
    // - if the URL points to a conference then deep-linking will take
    //   care of it.
    return isMobileBrowser() || JitsiMeetJS.isWebRtcSupported();
 */
}

/**
 * Returns whether or not the current environment is a supported
 * browser on a mobile device.
 *
 * @returns {boolean}
 */
export function isSupportedMobileBrowser() {
    return (Platform.OS === 'android' && browser.isChromiumBased())
        || (Platform.OS === 'android' && browser.isFirefox())
        || (Platform.OS === 'ios' && browser.isSafari());
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
function _isCurrentBrowserInList(list) {
    return Boolean(list.find(browserName => {
        const checkFunction = browserNameToCheck[browserName];

        return checkFunction ? checkFunction.call(browser) : false;
    }));
}
