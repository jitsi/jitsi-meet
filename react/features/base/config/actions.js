/* @flow */

import { LOAD_CONFIG_ERROR, SET_CONFIG } from './actionTypes';

/**
 * Signals an error when loading the configuration.
 *
 * @param {Error} error - The error which caused the config to not be loaded.
 * @returns {{
 *      type: LOAD_CONFIG_ERROR,
 *      error: Error
 * }}
 */
export function loadConfigError(error: Error) {
    return {
        type: LOAD_CONFIG_ERROR,
        error
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
