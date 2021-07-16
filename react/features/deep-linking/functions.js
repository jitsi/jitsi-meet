/* global interfaceConfig */

import { isMobileBrowser } from '../base/environment/utils';
import { Platform } from '../base/react';
import { URI_PROTOCOL_PATTERN } from '../base/util';
import { isVpaasMeeting } from '../jaas/functions';

import {
    DeepLinkingDesktopPage,
    DeepLinkingMobilePage,
    NoMobileApp
} from './components';
import { _openDesktopApp } from './openDesktopApp';

/**
 * Generates a deep linking URL based on the current window URL.
 *
 * @returns {string} - The generated URL.
 */
export function generateDeepLinkingURL() {
    // If the user installed the app while this Component was displayed
    // (e.g. the user clicked the Download the App button), then we would
    // like to open the current URL in the mobile app. The only way to do it
    // appears to be a link with an app-specific scheme, not a Universal
    // Link.

    const appScheme = interfaceConfig.APP_SCHEME || 'org.jitsi.meet';
    const { href } = window.location;
    const regex = new RegExp(URI_PROTOCOL_PATTERN, 'gi');

    // Android: use an intent link, custom schemes don't work in all browsers.
    // https://developer.chrome.com/multidevice/android/intents
    if (Platform.OS === 'android') {
        // https://meet.jit.si/foo -> meet.jit.si/foo
        const url = href.replace(regex, '').substr(2);
        const pkg = interfaceConfig.ANDROID_APP_PACKAGE || 'org.jitsi.meet';

        return `intent://${url}#Intent;scheme=${appScheme};package=${pkg};end`;
    }

    // iOS: Replace the protocol part with the app scheme.
    return href.replace(regex, `${appScheme}:`);
}

/**
 * Resolves with the component that should be displayed if the deep linking page
 * should be shown and with <tt>undefined</tt> otherwise.
 *
 * @param {Object} state - Object containing current redux state.
 * @returns {Promise<Component>}
 */
export function getDeepLinkingPage(state) {
    const { room } = state['features/base/conference'];
    const { launchInWeb } = state['features/deep-linking'];
    const appScheme = typeof interfaceConfig !== 'undefined' && interfaceConfig.APP_SCHEME;

    // Show only if we are about to join a conference.
    if (launchInWeb
            || !room
            || state['features/base/config'].disableDeepLinking
            || (isVpaasMeeting(state) && (!appScheme || appScheme === 'com.8x8.meet'))) {
        return Promise.resolve();
    }

    if (isMobileBrowser()) { // mobile
        const mobileAppPromo
            = typeof interfaceConfig === 'object'
                && interfaceConfig.MOBILE_APP_PROMO;

        return Promise.resolve(
            typeof mobileAppPromo === 'undefined' || Boolean(mobileAppPromo)
                ? DeepLinkingMobilePage : NoMobileApp);
    }

    return _openDesktopApp(state).then(
        // eslint-disable-next-line no-confusing-arrow
        result => result ? DeepLinkingDesktopPage : undefined);
}

/**
 * Opens the desktop app.
 *
 * @param {Object} state - Object containing current redux state.
 * @returns {Promise<boolean>} - Resolves with true if the attempt to open the desktop app was successful and resolves
 * with false otherwise.
 */
export function openDesktopApp(state) {
    return _openDesktopApp(state);
}
