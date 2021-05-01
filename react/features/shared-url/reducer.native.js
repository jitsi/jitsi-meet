// @flow

import { ReducerRegistry } from '../base/redux';

import { SET_SHARED_URL_STATUS } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/shared-video.
 */
ReducerRegistry.register('features/shared-url', (state = {}, action) => {
    const { sharedUrl, status, ownerId } = action;

    switch (action.type) {
    case SET_SHARED_URL_STATUS:
        return {
            ...state,
            sharedUrl,
            status,
            ownerId
        };
    default:
        return state;
    }
});
