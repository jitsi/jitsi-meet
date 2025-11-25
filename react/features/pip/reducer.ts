import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_PIP_ACTIVE } from './actionTypes';

/**
 * The default state for the pip feature.
 */
const DEFAULT_STATE = {
    isPiPActive: false
};

export interface IPipState {
    isPiPActive: boolean;
}

/**
 * Reduces the Redux actions of the pip feature.
 */
ReducerRegistry.register<IPipState>('features/pip', (state = DEFAULT_STATE, action): IPipState => {
    switch (action.type) {
    case SET_PIP_ACTIVE:
        return {
            ...state,
            isPiPActive: action.isPiPActive
        };

    default:
        return state;
    }
});
