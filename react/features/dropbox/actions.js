// @flow

import { getLocationContextRoot } from '../base/util';

import { UPDATE_DROPBOX_TOKEN } from './actionTypes';
import { _authorizeDropbox } from './functions';

/**
 * Action to authorize the Jitsi Recording app in dropbox.
 *
 * @returns {Function}
 */
export function authorizeDropbox() {
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const { locationURL } = state['features/base/connection'];
        const { dropbox = {} } = state['features/base/config'];
        const redirectURI = `${locationURL.origin
            + getLocationContextRoot(locationURL)}static/oauth.html`;

        _authorizeDropbox(dropbox.appKey, redirectURI)
            .then(
                token => dispatch(updateDropboxToken(token)));
    };
}

/**
 * Action to update the dropbox access token.
 *
 * @param {string} token - The new token.
 * @returns {{
 *     type: UPDATE_DROPBOX_TOKEN,
 *     token: string
 * }}
 */
export function updateDropboxToken(token: string) {
    return {
        type: UPDATE_DROPBOX_TOKEN,
        token
    };
}
