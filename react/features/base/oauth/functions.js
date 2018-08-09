// @flow

import { getJitsiMeetGlobalNS } from '../util';


/**
 * Executes the oauth flow.
 *
 * @param {string} authUrl - The URL to oauth service.
 * @returns {Promise<string>} - The URL with the authorization details.
 */
export function authorize(authUrl: string): Promise<string> {
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
