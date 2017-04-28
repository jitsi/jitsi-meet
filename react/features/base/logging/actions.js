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

/**
 * Starts log collector.
 *
 * @returns {Function}
 */
export function startLogCollector() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const { logCollector } = getState()['features/base/logging'];

        if (logCollector) {
            logCollector.start();

            dispatch(setLogCollectorStarted(true));

            // Make an attempt to flush in case a lot of logs have been
            // cached, before the collector was started.
            logCollector.flush();
        }
    };
}

/**
 * Stops log collector.
 *
 * @returns {Function}
 */
export function stopLogCollector() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const { logCollector } = getState()['features/base/logging'];

        if (logCollector) {
            logCollector.stop();

            dispatch(setLogCollectorStarted(false));
        }
    };
}
