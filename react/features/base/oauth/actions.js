// @flow

import { Dropbox } from 'dropbox';

import { getLocationContextRoot, parseStandardURIString } from '../util';
import { parseURLParams } from '../config';

import { authorize } from './functions';
import { UPDATE_DROPBOX_TOKEN } from './actionTypes';

/**
 * Action to authorize the Jitsi Recording app in dropbox.
 *
 * @returns {Function}
 */
export function authorizeDropbox() {
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const { locationURL } = state['features/base/connection'];
        const { dropbox } = state['features/base/config'];
        const redirectURI = `${locationURL.origin
            + getLocationContextRoot(locationURL)}static/oauth.html`;
        const dropboxAPI = new Dropbox({ clientId: dropbox.clientId });
        const url = dropboxAPI.getAuthenticationUrl(redirectURI);

        authorize(url).then(returnUrl => {
            const params
                = parseURLParams(parseStandardURIString(returnUrl), true) || {};

            dispatch(updateDropboxToken(params.access_token));
        });
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
