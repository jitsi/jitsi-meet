// @flow

import { browser } from '../../base/lib-jitsi-meet';

declare var JitsiMeetElectron: Object;

/**
 * Returns whether or not the current environment has the expected global
 * variables to use Google API integration in Electron.
 *
 * @returns {boolean}
 */
export function hasElectronIntegration() {
    return typeof JitsiMeetElectron === 'object'
        && Boolean(JitsiMeetElectron.googleApi);
}

/**
 * Returns whether or not the current environment can successfully exercise
 * integration with the Google API.
 *
 * @param {Object} state - Object containing current redux state.
 * @returns {boolean}
 */
export function envSupportsGoogleIntegration(state: Object) {
    if (!state['features/base/config'].googleApiApplicationClientID) {
        return false;
    }

    return browser.isElectron() ? hasElectronIntegration() : true;
}
