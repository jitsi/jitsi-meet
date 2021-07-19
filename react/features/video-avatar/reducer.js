// @flow

import { ReducerRegistry } from '../base/redux';

import { VIDEO_AVATAR_ENABLED } from './actionTypes';

const STORE_NAME = 'features/video-avatar';

/**
 * Reduces redux actions which activate/deactivate the video avatar
 *
 * @param {State} state - The current redux state.
 * @param {Action} action - The redux action to reduce.
 * @param {string} action.type - The type of the redux action to reduce..
 * @returns {State} The next redux state that is the result of reducing the
 * specified action.
 */
ReducerRegistry.register(STORE_NAME, (state = {}, action) => {
    const { videoAvatarEffectEnabled } = action;

    switch (action.type) {
    case VIDEO_AVATAR_ENABLED: {
        return {
            ...state,
            videoAvatarEffectEnabled
        };
    }
    }

    return state;
});
