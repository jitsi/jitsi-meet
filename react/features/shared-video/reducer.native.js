// @flow

import { ReducerRegistry } from '../base/redux';

import { SET_SHARED_VIDEO_STATUS } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/shared-video.
 */
ReducerRegistry.register('features/shared-video', (state = {}, action) => {
    const { videoId, status, time, ownerId } = action;

    switch (action.type) {
    case SET_SHARED_VIDEO_STATUS:
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
