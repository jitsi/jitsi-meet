// @flow

import { isWindows } from '../base/environment';
import { browser } from '../base/lib-jitsi-meet';


/**
 * State of audio sharing.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenAudioShared(state: Object) {
    return state['features/screen-share'].isSharingAudio;
}

/**
 * Returns the visibility of the audio only screen share button. Currently only chrome browser and electron on
 * windows supports this functionality.
 *
 * @returns {boolean}
 */
export function isScreenAudioSupported() {
    return browser.isChrome() || (browser.isElectron() && isWindows());
}
