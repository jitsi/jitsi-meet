/* global interfaceConfig */

import { URI_PROTOCOL_PATTERN } from '../base/util';

/**
 * Generates a deep linking URL based on the current window URL.
 *
 * @returns {string} - The generated URL.
 */
export function generateDeeplinkingURL() {
    // If the user installed the app while this Component was displayed
    // (e.g. the user clicked the Download the App button), then we would
    // like to open the current URL in the mobile app. The only way to do it
    // appears to be a link with an app-specific scheme, not a Universal
    // Link.
    const appScheme = interfaceConfig.APP_SCHEME || 'org.jitsi.meet';

    // Replace the protocol part with the app scheme.

    return window.location.href.replace(
            new RegExp(`^${URI_PROTOCOL_PATTERN}`), `${appScheme}:`);
}

/**
 * Returns <tt>true</tt> if deeplinking is enabled and <tt>false</tt> otherwise.
 *
 * @returns {boolean}
 */
export function isDeeplinkingEnabled() {
    return false;
}

/**
 * Resolves with <tt>true</tt> if the deeplinking page should be shown and with
 * <tt>false</tt> otherwise.
 *
 * @returns {Promise<boolean>}
 */
export function shouldShowDeeplinkingPage() {
    return Promise.resolve(false);
}

/**
 * Opens the desktop app.
 *
 * @returns {void}
 */
export function openDesktopApp() {
    window.location.href = generateDeeplinkingURL();
}
