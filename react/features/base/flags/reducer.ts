import { isEqual, merge } from 'lodash-es';

import ReducerRegistry from '../redux/ReducerRegistry';

import { UPDATE_FLAGS } from './actionTypes';

/**
 * Default state value for the feature flags.
 */
const DEFAULT_STATE = {};

export interface IFlagsState {
    flags?: Object;
}

/**
 * Reduces redux actions which handle feature flags.
 *
 * @param {State} state - The current redux state.
 * @param {Action} action - The redux action to reduce.
 * @param {string} action.type - The type of the redux action to reduce.
 * @returns {State} The next redux state that is the result of reducing the
 * specified action.
 */
ReducerRegistry.register<IFlagsState>('features/base/flags', (state = DEFAULT_STATE, action): IFlagsState => {
    switch (action.type) {
    case UPDATE_FLAGS: {
        const newState = merge({}, state, action.flags);

        return isEqual(state, newState) ? state : newState;
    }
    }

    return state;
});
