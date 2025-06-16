// @ts-expect-error
import { jitsiLocalStorage } from '@jitsi/js-utils';

import { IStore } from '../../app/types';
import { addKnownDomains } from '../known-domains/actions';
import { parseURIString } from '../util/uri';

import {
    CONFIG_WILL_LOAD,
    LOAD_CONFIG_ERROR,
    OVERWRITE_CONFIG,
    SET_CONFIG,
    UPDATE_CONFIG
} from './actionTypes';
import { IConfig } from './configType';
import { _CONFIG_STORE_PREFIX } from './constants';
import { setConfigFromURLParams } from './functions.any';


/**
 * Updates the config with new options.
 *
 * @param {Object} config - The new options (to add).
 * @returns {Function}
 */
export function updateConfig(config: IConfig) {
    return {
        type: UPDATE_CONFIG,
        config
    };
}

/**
 * Signals that the configuration (commonly known in Jitsi Meet as config.js)
 * for a specific locationURL will be loaded now.
 *
 * @param {URL} locationURL - The URL of the location which necessitated the
 * loading of a configuration.
 * @param {string} room - The name of the room (conference) for which we're loading the config for.
 * @returns {{
 *     type: CONFIG_WILL_LOAD,
 *     locationURL: URL,
 *     room: string
 * }}
 */
export function configWillLoad(locationURL: URL, room: string) {
    return {
        type: CONFIG_WILL_LOAD,
        locationURL,
        room
    };
}

/**
 * Signals that a configuration (commonly known in Jitsi Meet as config.js)
 * could not be loaded due to a specific error.
 *
 * @param {Error} error - The {@code Error} which prevented the successful
 * loading of a configuration.
 * @param {URL} locationURL - The URL of the location which necessitated the
 * loading of a configuration.
 * @returns {{
 *     type: LOAD_CONFIG_ERROR,
 *     error: Error,
 *     locationURL: URL
 * }}
 */
export function loadConfigError(error: Error, locationURL: URL) {
    return {
        type: LOAD_CONFIG_ERROR,
        error,
        locationURL
    };
}

/**
 * Overwrites some config values.
 *
 * @param {Object} config - The new options (to overwrite).
 * @returns {{
 *     type: OVERWRITE_CONFIG,
 *     config: Object
 * }}
 */
export function overwriteConfig(config: Object) {
    return {
        type: OVERWRITE_CONFIG,
        config
    };
}

/**
 * Sets the configuration represented by the feature base/config. The
 * configuration is defined and consumed by the library lib-jitsi-meet but some
 * of its properties are consumed by the application jitsi-meet as well.
 *
 * @param {Object} config - The configuration to be represented by the feature
 * base/config.
 * @returns {Function}
 */
export function setConfig(config: IConfig = {}) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { locationURL } = getState()['features/base/connection'];

        // Now that the loading of the config was successful override the values
        // with the parameters passed in the hash part of the location URI.
        // TODO We're still in the middle ground between old Web with config,
        // and interfaceConfig used via global variables and new
        // Web and mobile reading the respective values from the redux store.
        // Only the config will be overridden on React Native, as the other
        // globals will be undefined here. It's intentional - we do not care to
        // override those configs yet.
        locationURL
            && setConfigFromURLParams(

                // On Web the config also comes from the window.config global,
                // but it is resolved in the loadConfig procedure.
                config,
                window.interfaceConfig,
                locationURL);

        let { bosh } = config;

        if (bosh) {
            // Normalize the BOSH URL.
            if (bosh.startsWith('//')) {
                // By default our config.js doesn't include the protocol.
                bosh = `${locationURL?.protocol}${bosh}`;
            } else if (bosh.startsWith('/')) {
                // Handle relative URLs, which won't work on mobile.
                const {
                    protocol,
                    host,
                    contextRoot
                } = parseURIString(locationURL?.href);

                bosh = `${protocol}//${host}${contextRoot || '/'}${bosh.substr(1)}`;
            }
            config.bosh = bosh;
        }

        dispatch({
            type: SET_CONFIG,
            config
        });
    };
}

/**
 * Stores a specific Jitsi Meet config.js object into {@code localStorage}.
 *
 * @param {string} baseURL - The base URL from which the config.js was
 * downloaded.
 * @param {Object} config - The Jitsi Meet config.js to store.
 * @returns {Function}
 */
export function storeConfig(baseURL: string, config: Object) {
    return (dispatch: IStore['dispatch']) => {
        // Try to store the configuration in localStorage. If the deployment
        // specified 'getroom' as a function, for example, it does not make
        // sense to and it will not be stored.
        let b = false;

        try {
            if (typeof window.config === 'undefined' || window.config !== config) {
                jitsiLocalStorage.setItem(`${_CONFIG_STORE_PREFIX}/${baseURL}`, JSON.stringify(config));
                b = true;
            }
        } catch (e) {
            // Ignore the error because the caching is optional.
        }

        // If base/config knows a domain, then the app knows it.
        if (b) {
            try {
                dispatch(addKnownDomains(parseURIString(baseURL)?.host));
            } catch (e) {
                // Ignore the error because the fiddling with "known domains" is
                // a side effect here.
            }
        }

        return b;
    };
}
