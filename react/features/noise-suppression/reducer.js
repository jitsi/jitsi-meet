
import { ReducerRegistry } from '../base/redux';

import {
    SET_NOISE_SUPPRESSION_STATE
} from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/noise-suppression.
 */
ReducerRegistry.register('features/noise-suppression', (state = {}, action) => {
    const { isNoiseSuppressionActive } = action;

    switch (action.type) {
    case SET_NOISE_SUPPRESSION_STATE:
        return {
            ...state,
            isNoiseSuppressionActive
        };
    default:
        return state;
    }
});
