// @flow

import { NativeModules } from 'react-native';

const { Dropbox } = NativeModules;

import { setPictureInPictureDisabled } from '../mobile/picture-in-picture/functions';

/**
 * Action to authorize the Jitsi Recording app in dropbox.
 *
 * @returns {Promise<Object>} - The promise will be resolved with the dropbox
 * access token or rejected with an error.
 */
export async function _authorizeDropbox(): Promise<Object> {
    setPictureInPictureDisabled(true);

    try {
        return await Dropbox.authorize();
    } finally {
        setPictureInPictureDisabled(false);
    }
}

/**
 * Gets a new acccess token based on the refresh token.
 *
 * @returns {Promise}
 */
export function getNewAccessToken() {
    return _authorizeDropbox();
}

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
 * Returns <tt>true</tt> if the dropbox features is enabled and <tt>false</tt>
 * otherwise.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isEnabled(state: Object) {
    const { dropbox = {} } = state['features/base/config'];

    return Dropbox.ENABLED && typeof dropbox.appKey === 'string';
}
