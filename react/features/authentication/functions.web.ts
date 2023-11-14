import base64js from 'base64-js';

import { IConfig } from '../base/config/configType';
import { browser } from '../base/lib-jitsi-meet';

import { _getTokenAuthState } from './functions.any';

export * from './functions.any';

/**
 * Based on rfc7636 we need a random string for a code verifier.
 */
const POSSIBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Crypto random, alternative of Math.random.
 *
 * @returns {float} A random value.
 */
function _cryptoRandom() {
    const typedArray = new Uint8Array(1);
    const randomValue = crypto.getRandomValues(typedArray)[0];

    return randomValue / Math.pow(2, 8);
}

/**
 * Creates the URL pointing to JWT token authentication service. It is
 * formatted from the 'urlPattern' argument which can contain the following
 * constants:
 * '{room}' - name of the conference room passed as <tt>roomName</tt>
 * argument to this method.
 *
 * @param {boolean} audioOnlyEnabled - Join conference audio only.
 * @param {Object} config - Configuration state object from store. A URL pattern pointing to the login service.
 * @param {string} roomName - The name of the conference room for which the user will be authenticated.
 * @param {string} tenant - The name of the conference tenant.
 * @param {boolean} skipPrejoin - Whether to skip pre-join page.
 * @param {URL} locationURL - The current location URL.
 *
 * @returns {Promise<string|undefined>} - The URL pointing to JWT login service or
 * <tt>undefined</tt> if the pattern stored in config is not a string and the URL can not be
 * constructed.
 */
export const getTokenAuthUrl = (
        audioOnlyEnabled: boolean | undefined = false,
        config: IConfig,
        roomName: string | undefined,
        tenant: string | undefined,
        skipPrejoin: boolean | undefined = false,
        // eslint-disable-next-line max-params
        locationURL: URL): Promise<string | undefined> => {

    let url = config.tokenAuthUrl;

    if (!url || !roomName) {
        return Promise.resolve(undefined);
    }

    if (url.indexOf('{state}')) {
        const state = _getTokenAuthState(audioOnlyEnabled, roomName, tenant, skipPrejoin, locationURL);

        if (browser.isElectron()) {
            // @ts-ignore
            state.electron = true;
        }

        url = url.replace('{state}', encodeURIComponent(JSON.stringify(state)));
    }

    url = url.replace('{room}', roomName);

    if (url.indexOf('{code_challenge}')) {
        let codeVerifier = '';

        // random string
        for (let i = 0; i < 64; i++) {
            codeVerifier += POSSIBLE_CHARS.charAt(Math.floor(_cryptoRandom() * POSSIBLE_CHARS.length));
        }

        window.sessionStorage.setItem('code_verifier', codeVerifier);

        return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
            .then(digest => {
                // prepare code challenge - base64 encoding without padding as described in:
                // https://datatracker.ietf.org/doc/html/rfc7636#appendix-A
                const codeChallenge = base64js.fromByteArray(new Uint8Array(digest))
                    .replace(/=/g, '')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_');

                return url ? url.replace('{code_challenge}', codeChallenge) : undefined;
            });
    }

    return Promise.resolve(url);
};
