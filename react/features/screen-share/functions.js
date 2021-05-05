// @flow

import { isMacOS } from '../base/environment';
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
 * Returns the visibility of the audio only screen share button. Currently electron on mac os doesn't
 * have support for this functionality.
 *
 * @returns {boolean}
 */
export function isScreenAudioSupported() {
    return !(browser.isElectron() && isMacOS());
}
