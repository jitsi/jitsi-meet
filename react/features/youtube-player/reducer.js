// @flow
import { ReducerRegistry } from '../base/redux';

import { SET_SHARED_VIDEO_STATUS } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/youtube-player.
 */
ReducerRegistry.register('features/youtube-player', (state = {}, action) => {
    switch (action.type) {
    case SET_SHARED_VIDEO_STATUS:
        return {
            ...state,
            status: action.status,
            time: action.time,
            ownerId: action.ownerId
        };
    default:
        return state;
    }
});
