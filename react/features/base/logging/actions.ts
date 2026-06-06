import { SET_LOGGING_CONFIG, SET_LOG_COLLECTOR } from './actionTypes';

/**
 * Stores a {@code Logger.LogCollector} instance which will be uploading logs.
 *
 * @param {Logger.LogCollector} logCollector - The log collector instance to be
 * stored in the Redux state of base/logging feature.
 * @returns {{
 *     type,
 *     logCollector: Object
 * }}
 */
export function setLogCollector(logCollector?: Object) {
    return {
        type: SET_LOG_COLLECTOR,
        logCollector
    };
}

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
