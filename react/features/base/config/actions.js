/* @flow */

import {
    CONFIG_WILL_LOAD,
    LOAD_CONFIG_ERROR,
    SET_CONFIG
} from './actionTypes';

/**
 * Signals that the configuration for a specific locationURL will be loaded now.
 *
 * @param {string|URL} locationURL - The URL of the location which necessitated
 * the loading of a configuration.
 * @returns {{
 *     type: CONFIG_WILL_LOAD,
 *     locationURL
 * }}
 */
export function configWillLoad(locationURL: string | URL) {
    return {
        type: CONFIG_WILL_LOAD,
        locationURL
    };
}

/**
 * Signals that a configuration could not be loaded due to a specific error.
 *
 * @param {Error} error - The {@code Error} which prevented the successful
 * loading of a configuration.
 * @param {string|URL} locationURL - The URL of the location which necessitated
 * the loading of a configuration.
 * @returns {{
 *     type: LOAD_CONFIG_ERROR,
 *     error: Error,
 *     locationURL
 * }}
 */
export function loadConfigError(error: Error, locationURL: string | URL) {
    return {
        type: LOAD_CONFIG_ERROR,
        error,
        locationURL
    };
}

/**
 * Sets the configuration represented by the feature base/config. The
 * configuration is defined and consumed by the library lib-jitsi-meet but some
 * of its properties are consumed by the application jitsi-meet as well.
 *
 * @param {Object} config - The configuration to be represented by the feature
 * base/config.
 * @returns {{
 *     type: SET_CONFIG,
 *     config: Object
 * }}
 */
export function setConfig(config: Object = {}) {
    return {
        type: SET_CONFIG,
        config
    };
}
