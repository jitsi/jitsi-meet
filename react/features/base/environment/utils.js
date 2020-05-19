// @flow

import Platform from '../react/Platform';

const { browser } = JitsiMeetJS.util;

/**
 * Returns whether or not the current environment is a mobile device.
 *
 * @returns {boolean}
 */
export function isMobileBrowser() {
    return Platform.OS === 'android' || Platform.OS === 'ios';
}

export function isMobileBrowserSupported() {
    return (Platform.OS === 'android' && browser.isChrome())
        || (Platform.OS === 'android' && browser.isFirefox())
        || (Platform.OS === 'ios' && browser.isSafari());
}

/**
 * Checks whether the chrome extensions defined in the config file are installed or not.
 *
 * @param {Object} config - Objects containing info about the configured extensions.
 *
 * @returns {Promise[]}
 */
export function checkChromeExtensionsInstalled(config: Object = {}) {
    const isExtensionInstalled = info => new Promise(resolve => {
        const img = new Image();

        img.src = `chrome-extension://${info.id}/${info.path}`;
        img.onload = function() {
            resolve(true);
        };
        img.onerror = function() {
            resolve(false);
        };
    });
    const extensionInstalledFunction = info => isExtensionInstalled(info);

    return Promise.all(
        (config.chromeExtensionsInfo || []).map(info => extensionInstalledFunction(info))
    );
}
