// @flow

import { ReducerRegistry } from '../base/redux';

import { SET_SHARED_VIDEO_STATUS2 } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/shared-video.
 */
ReducerRegistry.register('features/shared-video2', (state = {}, action) => {
    const { videoId, status, time, ownerId } = action;

    switch (action.type) {
    case SET_SHARED_VIDEO_STATUS2:
        return {
            ...state,
            videoId,
            status,
            time,
            ownerId
        };
    default:
        return state;
    }
});
