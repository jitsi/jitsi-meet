import { equals, ReducerRegistry } from '../redux';

import { SET_LOGGING_CONFIG } from './actionTypes';

/**
 * The initial state of the feature base/logging.
 *
 * @type {{
 *     config: Object
 * }}
 */
const INITIAL_STATE = {
    config: {
        defaultLogLevel: 'trace',

        // The following are too verbose in their logging with the
        // {@link #defaultLogLevel}:
        'modules/statistics/CallStats.js': 'info',
        'modules/xmpp/strophe.util.js': 'log'
    }
};

ReducerRegistry.register(
    'features/base/logging',
    (state = INITIAL_STATE, action) => {
        switch (action.type) {
        case SET_LOGGING_CONFIG:
            return _setLoggingConfig(state, action);

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
        // The config of INITIAL_STATE is the default configuration of the
        // feature base/logging.
        ...INITIAL_STATE.config,
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
