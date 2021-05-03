// @flow

import { ReducerRegistry } from '../base/redux';

import { SET_SHARED_URL_STATUS, SET_DISABLE_BUTTON } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/shared-url.
 */
ReducerRegistry.register('features/shared-url', (state = {}, action) => {
    const { status, disabled } = action;

    switch (action.type) {
    case SET_SHARED_URL_STATUS:
        return {
            ...state,
            status
        };

    case SET_DISABLE_BUTTON:
        return {
            ...state,
            disabled
        };

    default:
        return state;
    }
});
