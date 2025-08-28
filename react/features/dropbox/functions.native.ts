import { NativeModules } from 'react-native';

import { IReduxState } from '../app/types';
import { setPictureInPictureEnabled } from '../mobile/picture-in-picture/functions';

const { Dropbox } = NativeModules;

/**
 * Action to authorize the Jitsi Recording app in dropbox.
 *
 * @param {any} _appKey - Used on web.
 * @param {any} _redirectURI - Used on web.
 * @returns {Promise<Object>} - The promise will be resolved with the dropbox
 * access token or rejected with an error.
 */
export async function _authorizeDropbox(_appKey?: any, _redirectURI?: any): Promise<any> {
    setPictureInPictureEnabled(false);

    try {
        return await Dropbox.authorize();
    } finally {
        setPictureInPictureEnabled(true);
    }
}

/**
 * Gets a new access token based on the refresh token.
 *
 * @param {string} _appKey - The dropbox appKey.
 * @param {string} _rToken - The refresh token.
 * @returns {Promise}
 */
export function getNewAccessToken(_appKey: string, _rToken: string) {
    return _authorizeDropbox();
}

/**
 * Returns the display name for the current dropbox account.
 *
 * @param {string} token - The dropbox access token.
 * @param {any} _appKey - Used on web.
 * @returns {Promise<string>} - The promise will be resolved with the display
 * name or rejected with an error.
 */
export function getDisplayName(token: string, _appKey?: any) {
    return Dropbox.getDisplayName(token);
}

/**
 * Returns information about the space usage for the current dropbox account.
 *
 * @param {string} token - The dropbox access token.
 * @param {any} _appKey - Used on web.
 * @returns {Promise<{ used: number, allocated: number}>} - The promise will be
 * resolved with the object with information about the space usage (the used
 * space and the allocated space) for the current dropbox account or rejected
 * with an error.
 */
export function getSpaceUsage(token: string, _appKey?: any) {
    return Dropbox.getSpaceUsage(token);
}

/**
 * Returns <tt>true</tt> if the dropbox features is enabled and <tt>false</tt>
 * otherwise.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isEnabled(state: IReduxState) {
    const { dropbox = { appKey: undefined } } = state['features/base/config'];

    return Boolean(Dropbox?.ENABLED && typeof dropbox.appKey === 'string');
}
