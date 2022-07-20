import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_NOISE_SUPPRESSION_ENABLED
} from './actionTypes';

export interface INoiseSuppressionState {
    enabled: boolean
}

const DEFAULT_STATE = {
    enabled: false
};

/**
 * Reduces the Redux actions of the feature features/noise-suppression.
 */
ReducerRegistry.register('features/noise-suppression', (state: INoiseSuppressionState = DEFAULT_STATE, action: any) => {
    const { enabled } = action;

    switch (action.type) {
    case SET_NOISE_SUPPRESSION_ENABLED:
        return {
            ...state,
            enabled
        };
    default:
        return state;
    }
});
