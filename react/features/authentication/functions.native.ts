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
 * @param {string} roomName - The name of the conference room for which the user will be authenticated.
 * @param {string} tenant - The name of the conference tenant.
 * @param {string} skipPrejoin - The name of the conference room for which the user will be authenticated.
 *
 * @returns {Promise<string|undefined>} - The URL pointing to JWT login service or
 * <tt>undefined</tt> if the pattern stored in config is not a string and the URL can not be
 * constructed.
 */
export const getTokenAuthUrl = (
        config: IConfig,
        roomName: string | undefined,
        tenant: string | undefined,
        skipPrejoin: boolean | undefined = false): Promise<string | undefined> => {

    let url = config.tokenAuthUrl;

    if (!url || !roomName) {
        return Promise.resolve(undefined);
    }

    if (url.indexOf('{state}')) {
        const state = _getTokenAuthState(roomName, tenant, skipPrejoin);

        // Append ios=true or android=true to the token URL.
        // @ts-ignore
        state[Platform.OS] = true;

        url = url.replace('{state}', encodeURIComponent(JSON.stringify(state)));
    }

    return Promise.resolve(url.replace('{room}', roomName));
};
