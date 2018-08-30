// @flow

import { Dropbox } from 'dropbox';

import {
    getJitsiMeetGlobalNS,
    getLocationContextRoot,
    parseStandardURIString
} from '../base/util';
import { parseURLParams } from '../base/config';

import { UPDATE_DROPBOX_TOKEN } from './actionTypes';

/**
 * Executes the oauth flow.
 *
 * @param {string} authUrl - The URL to oauth service.
 * @returns {Promise<string>} - The URL with the authorization details.
 */
function authorize(authUrl: string): Promise<string> {
    const windowName = `oauth${Date.now()}`;
    const gloabalNS = getJitsiMeetGlobalNS();

    gloabalNS.oauthCallbacks = gloabalNS.oauthCallbacks || {};

    return new Promise(resolve => {
        const popup = window.open(authUrl, windowName);

        gloabalNS.oauthCallbacks[windowName] = () => {
            const returnURL = popup.location.href;

            popup.close();
            delete gloabalNS.oauthCallbacks.windowName;
            resolve(returnURL);
        };
    });
}

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
