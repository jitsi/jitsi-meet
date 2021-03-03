// @flow

import { ReducerRegistry } from '../base/redux';

import { SET_SHARED_VIDEO_STATUS, SET_DISABLE_BUTTON } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/shared-video.
 */
ReducerRegistry.register('features/shared-video', (state = {}, action) => {
    const { status, disabled } = action;

    switch (action.type) {
    case SET_SHARED_VIDEO_STATUS:
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
