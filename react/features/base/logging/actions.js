/* @flow */

import {
    SET_LOG_COLLECTOR,
    SET_LOG_COLLECTOR_STARTED,
    SET_LOGGING_CONFIG
} from './actionTypes';

/**
 * Sets new log collector instance to Redux store.
 *
 * @param {Object} logCollector - Instance of log collector.
 * @returns {{
 *     type: SET_LOG_COLLECTOR,
 *     logCollector: Object
 * }}
 */
export function setLogCollector(logCollector: Object) {
    return {
        type: SET_LOG_COLLECTOR,
        logCollector
    };
}

/**
 * Set log collector is started value to true or false (depends on the flag
 * passed as argument).
 *
 * @param {boolean} isStarted - Flag which indicates whether log collector is
 * started.
 * @returns {{
 *     type: SET_LOG_COLLECTOR_STARTED,
 *     isStarted: boolean
 * }}
 */
export function setLogCollectorStarted(isStarted: boolean): Object {
    return {
        type: SET_LOG_COLLECTOR_STARTED,
        isStarted
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
