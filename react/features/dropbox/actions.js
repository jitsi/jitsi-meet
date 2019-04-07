// @flow

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

        // By default we use the static page on the main domain for redirection.
        // So we need to setup only one redirect URI in dropbox app
        // configuration (not multiple for all the tenants).
        // In case deployment is running in subfolder dropbox.redirectURI
        // can be configured.
        const redirectURI
            = dropbox.redirectURI || `${locationURL.origin}/static/oauth.html`;

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
