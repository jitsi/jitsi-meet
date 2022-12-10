import {
    SET_CONFIG
} from '../config/actionTypes';
import { IConfig } from '../config/configType';
import ReducerRegistry from '../redux/ReducerRegistry';
import { set } from '../redux/functions';

import { SET_LAST_N } from './actionTypes';
import { validateLastNLimits } from './functions';

export interface ILastNState {
    lastN?: number;
    lastNLimits?: {
        [key: number]: number;
    };
}

ReducerRegistry.register<ILastNState>('features/base/lastn', (state = {}, action): ILastNState => {
    switch (action.type) {
    case SET_CONFIG:
        return _setConfig(state, action);
    case SET_LAST_N: {
        const { lastN } = action;

        return {
            ...state,
            lastN
        };
    }
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
function _setConfig(state: ILastNState, { config }: { config: IConfig; }) {
    return set(state, 'lastNLimits', validateLastNLimits(config.lastNLimits));
}
