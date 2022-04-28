
import { ReducerRegistry } from '../base/redux';

import {
    SET_DENOISE_STATE
} from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/screen-share.
 */
ReducerRegistry.register('features/denoise', (state = {}, action) => {
    const { isDnoiseActive } = action;

    switch (action.type) {
    case SET_DENOISE_STATE:
        return {
            ...state,
            isDnoiseActive
        };
    default:
        return state;
    }
});
