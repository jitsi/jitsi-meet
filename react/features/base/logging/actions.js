/* @flow */

import { SET_LOGGING_CONFIG } from './actionTypes';

/**
 * Sets the configuration of the feature base/logging.
 *
 * @param {Object} config - The configuration to set on the features
 * base/logging.
 * @returns {{
 *     type: SET_LOGGING_CONFIG,
 *     config: Object
 * }}
 */
export function setLoggingConfig(config: Object) {
    return {
        type: SET_LOGGING_CONFIG,
        config
    };
}
