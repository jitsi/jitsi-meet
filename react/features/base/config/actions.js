/* @flow */

import { SET_CONFIG } from './actionTypes';

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
export function setConfig(config: Object) {
    return {
        type: SET_CONFIG,
        config
    };
}
