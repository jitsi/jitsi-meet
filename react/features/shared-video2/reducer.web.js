// @flow

import { ReducerRegistry } from '../base/redux';

import { SET_SHARED_VIDEO_STATUS2, SET_DISABLE_BUTTON2 } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/shared-video.
 */
ReducerRegistry.register('features/shared-video2', (state = {}, action) => {
    const { status, disabled } = action;

    switch (action.type) {
    case SET_SHARED_VIDEO_STATUS2:
        return {
            ...state,
            status
        };

    case SET_DISABLE_BUTTON2:
        return {
            ...state,
            disabled
        };

    default:
        return state;
    }
});
