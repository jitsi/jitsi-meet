import { Platform } from 'react-native';

import { IConfig } from '../base/config/configType';

import { _getTokenAuthState } from './functions.any';

export * from './functions.any';

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

        // Append ios=true or android=true to the token URL.
        // @ts-ignore
        state[Platform.OS] = true;

        url = url.replace('{state}', encodeURIComponent(JSON.stringify(state)));
    }

    return Promise.resolve(url.replace('{room}', roomName));
};
