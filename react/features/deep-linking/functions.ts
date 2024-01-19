import { IReduxState } from '../app/types';
import { isMobileBrowser } from '../base/environment/utils';
import Platform from '../base/react/Platform';
import { URI_PROTOCOL_PATTERN } from '../base/util/uri';
import { isVpaasMeeting } from '../jaas/functions';

import DeepLinkingDesktopPage from './components/DeepLinkingDesktopPage';
import DeepLinkingMobilePage from './components/DeepLinkingMobilePage';
import NoMobileApp from './components/NoMobileApp';
import { _openDesktopApp } from './openDesktopApp';

/**
 * Generates a deep linking URL based on the current window URL.
 *
 * @param {Object} state - Object containing current redux state.
 *
 * @returns {string} - The generated URL.
 */
export function generateDeepLinkingURL(state: IReduxState) {
    // If the user installed the app while this Component was displayed
    // (e.g. the user clicked the Download the App button), then we would
    // like to open the current URL in the mobile app. The only way to do it
    // appears to be a link with an app-specific scheme, not a Universal
    // Link.

    const { href } = window.location;
    const regex = new RegExp(URI_PROTOCOL_PATTERN, 'gi');

    // @ts-ignore
    const mobileConfig = state['features/base/config'].deeplinking?.[Platform.OS] || {};

    const { appScheme, appPackage } = mobileConfig;

    // Android: use an intent link, custom schemes don't work in all browsers.
    // https://developer.chrome.com/multidevice/android/intents
    if (Platform.OS === 'android') {
        // https://meet.jit.si/foo -> meet.jit.si/foo
        const url = href.replace(regex, '').substr(2);

        return `intent://${url}#Intent;scheme=${appScheme};package=${appPackage};end`;
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
export function getDeepLinkingPage(state: IReduxState) {
    const { room } = state['features/base/conference'];
    const { launchInWeb } = state['features/deep-linking'];
    const deeplinking = state['features/base/config'].deeplinking || {};

    // @ts-ignore
    const { appScheme } = deeplinking?.[Platform.OS as keyof typeof deeplinking] || {};

    // Show only if we are about to join a conference.
    if (launchInWeb
            || !room
            || state['features/base/config'].deeplinking?.disabled
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
export function openDesktopApp(state: IReduxState) {
    return _openDesktopApp(state);
}
