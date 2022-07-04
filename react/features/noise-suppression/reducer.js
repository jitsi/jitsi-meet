
import { ReducerRegistry } from '../base/redux';

import {
    SET_NOISE_SUPPRESSION_STATE
} from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/noise-suppression.
 */
ReducerRegistry.register('features/noise-suppression', (state = {}, action) => {
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
