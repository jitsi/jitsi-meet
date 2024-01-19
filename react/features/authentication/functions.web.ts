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
 * @param {Object} config - Configuration state object from store. A URL pattern pointing to the login service.
 * @param {URL} locationURL - The location URL.
 * @param {Object} options:  - Config options {
 *     audioMuted: boolean | undefined
 *     audioOnlyEnabled: boolean | undefined,
 *     skipPrejoin: boolean | undefined,
 *     videoMuted: boolean | undefined
 * }.
 * @param {string?} roomName - The room name.
 * @param {string?} tenant - The tenant name if any.
 *
 * @returns {Promise<string|undefined>} - The URL pointing to JWT login service or
 * <tt>undefined</tt> if the pattern stored in config is not a string and the URL can not be
 * constructed.
 */
export const getTokenAuthUrl = (
        config: IConfig,
        locationURL: URL,
        options: {
            audioMuted: boolean | undefined;
            audioOnlyEnabled: boolean | undefined;
            skipPrejoin: boolean | undefined;
            videoMuted: boolean | undefined;
        },
        roomName: string | undefined,
        // eslint-disable-next-line max-params
        tenant: string | undefined): Promise<string | undefined> => {

    const {
        audioMuted = false,
        audioOnlyEnabled = false,
        skipPrejoin = false,
        videoMuted = false
    } = options;

    let url = config.tokenAuthUrl;

    if (!url || !roomName) {
        return Promise.resolve(undefined);
    }

    if (url.indexOf('{state}')) {
        const state = _getTokenAuthState(
            locationURL,
            {
                audioMuted,
                audioOnlyEnabled,
                skipPrejoin,
                videoMuted
            },
            roomName,
            tenant
        );

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
