import {
    SET_CONFIG
} from '../config';
import { ReducerRegistry, set } from '../redux';

import { validateLastNLimits } from './functions';

ReducerRegistry.register('features/base/lastn', (state = { }, action) => {
    switch (action.type) {
    case SET_CONFIG:
        return _setConfig(state, action);
    }

    return state;
});

/**
 * Reduces a specific Redux action SET_CONFIG.
 *
 * @param {Object} state - The Redux state of feature base/lastn.
 * @param {Action} action - The Redux action SET_CONFIG to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _setConfig(state, { config }) {
    return set(state, 'lastNLimits', validateLastNLimits(config.lastNLimits));
}
