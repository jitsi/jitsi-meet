// @flow

import { NativeModules } from 'react-native';

const { Dropbox } = NativeModules;

/**
 * Returns the display name for the current dropbox account.
 *
 * @param {string} token - The dropbox access token.
 * @returns {Promise<string>} - The promise will be resolved with the display
 * name or rejected with an error.
 */
export function getDisplayName(token: string) {
    return Dropbox.getDisplayName(token);
}

/**
 * Returns information about the space usage for the current dropbox account.
 *
 * @param {string} token - The dropbox access token.
 * @returns {Promise<{ used: number, allocated: number}>} - The promise will be
 * resolved with the object with information about the space usage (the used
 * space and the allocated space) for the current dropbox account or rejected
 * with an error.
 */
export function getSpaceUsage(token: string) {
    return Dropbox.getSpaceUsage(token);
}


/**
 * Action to authorize the Jitsi Recording app in dropbox.
 *
 * @param {string} clientId - The Jitsi Recorder dropbox app ID.
 * @param {string} redirectURI - The return URL.
 * @returns {Promise<string>} - The promise will be resolved with the dropbox
 * access token or rejected with an error.
 */
export function _authorizeDropbox(): Promise<string> {
    return Dropbox.authorize();
}

/**
 * Returns <tt>true</tt> if the dropbox features is enabled and <tt>false</tt>
 * otherwise.
 *
 * @returns {boolean}
 */
export function isEnabled() {
    return Dropbox.ENABLED;
}
