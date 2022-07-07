// @ts-ignore
import { ReducerRegistry } from '../base/redux';

import {
    SET_NOISE_SUPPRESSION_STATE
} from './actionTypes';

export interface INoiseSuppressionState {
    active: boolean
}

const DEFAULT_STATE = {
    active: false
};

/**
 * Reduces the Redux actions of the feature features/noise-suppression.
 */
ReducerRegistry.register('features/noise-suppression', (state: INoiseSuppressionState = DEFAULT_STATE, action: any) => {
    const { active } = action;

    switch (action.type) {
    case SET_NOISE_SUPPRESSION_STATE:
        return {
            ...state,
            active
        };
    default:
        return state;
    }
});
