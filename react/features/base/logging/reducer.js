// @flow

import { equals, ReducerRegistry, set } from '../redux';

import { SET_LOG_COLLECTOR, SET_LOGGING_CONFIG } from './actionTypes';

/**
 * The default/initial redux state of the feature base/logging.
 *
 * @type {{
 *     config: Object
 * }}
 */
const DEFAULT_STATE = {
    config: require('../../../../logging_config.js'),

    /**
     * The log collector.
     */
    logCollector: undefined
};

ReducerRegistry.register(
    'features/base/logging',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_LOGGING_CONFIG:
            return _setLoggingConfig(state, action);
        case SET_LOG_COLLECTOR: {
            return _setLogCollector(state, action);
        }

        default:
            return state;
        }
    });

/**
 * Reduces a specific Redux action SET_LOGGING_CONFIG of the feature
 * base/logging.
 *
 * @param {Object} state - The Redux state of the feature base/logging.
 * @param {Action} action - The Redux action SET_LOGGING_CONFIG to reduce.
 * @private
 * @returns {Object} The new state of the feature base/logging after the
 * reduction of the specified action.
 */
function _setLoggingConfig(state, action) {
    const config = {
        // The config of DEFAULT_STATE is the default configuration of the
        // feature base/logging.
        ...DEFAULT_STATE.config,
        ...action.config
    };

    if (equals(state.config, config)) {
        return state;
    }

    return {
        ...state,
        config
    };
}

/**
 * Reduces a specific Redux action SET_LOG_COLLECTOR of the feature
 * base/logging.
 *
 * @param {Object} state - The Redux state of the feature base/logging.
 * @param {Action} action - The Redux action SET_LOG_COLLECTOR to reduce.
 * @private
 * @returns {Object} The new state of the feature base/logging after the
 * reduction of the specified action.
 */
function _setLogCollector(state, action) {
    return set(state, 'logCollector', action.logCollector);
}
