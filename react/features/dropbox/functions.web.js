// @flow

import { Dropbox } from 'dropbox';

import {
    getJitsiMeetGlobalNS,
    parseStandardURIString
} from '../base/util';
import { parseURLParams } from '../base/config';

/**
 * Returns the display name for the current dropbox account.
 *
 * @param {string} token - The dropbox access token.
 * @param {string} clientId - The Jitsi Recorder dropbox app ID.
 * @returns {Promise<string>}
 */
export function getDisplayName(token: string, clientId: string) {
    const dropboxAPI = new Dropbox({
        accessToken: token,
        clientId
    });

    return (
        dropboxAPI.usersGetCurrentAccount()
            .then(account => account.name.display_name));
}

/**
 * Returns information about the space usage for the current dropbox account.
 *
 * @param {string} token - The dropbox access token.
 * @param {string} clientId - The Jitsi Recorder dropbox app ID.
 * @returns {Promise<Object>}
 */
export function getSpaceUsage(token: string, clientId: string) {
    const dropboxAPI = new Dropbox({
        accessToken: token,
        clientId
    });

    return dropboxAPI.usersGetSpaceUsage().then(space => {
        const { allocation, used } = space;
        const { allocated } = allocation;

        return {
            used,
            allocated
        };
    });
}


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
 * @param {string} clientId - The Jitsi Recorder dropbox app ID.
 * @param {string} redirectURI - The return URL.
 * @returns {Promise<string>}
 */
export function _authorizeDropbox(
        clientId: string,
        redirectURI: string
): Promise<string> {
    const dropboxAPI = new Dropbox({ clientId });
    const url = dropboxAPI.getAuthenticationUrl(redirectURI);

    return authorize(url).then(returnUrl => {
        const params
            = parseURLParams(parseStandardURIString(returnUrl), true) || {};

        return params.access_token;
    });
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

    return typeof dropbox.clientId === 'string';
}
