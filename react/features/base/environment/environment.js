// @flow

import JitsiMeetJS from '../lib-jitsi-meet';
import { Platform } from '../react';

import { isBlacklistedEnvironment } from './isBlacklistedEnvironment';

/**
 * Returns whether or not the current browser should allow the app to display.
 *
 * @returns {boolean}
 */
export function isSupportedBrowser() {
    if (navigator.product === 'ReactNative' || isBlacklistedEnvironment()) {
        return false;
    }

    // We are intentionally allow mobile browsers because:
    // - the WelcomePage is mobile ready;
    // - if the URL points to a conference then deep-linking will take
    //   care of it.
    return Platform.OS === 'android'
        || Platform.OS === 'ios'
        || JitsiMeetJS.isWebRtcSupported();
}
