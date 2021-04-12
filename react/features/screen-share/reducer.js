
import { ReducerRegistry } from '../base/redux';

import { SET_SCREEN_AUDIO_SHARE_STATE } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/screen-share.
 */
ReducerRegistry.register('features/screen-share', (state = {}, action) => {
    const { isSharingAudio } = action;

    switch (action.type) {
    case SET_SCREEN_AUDIO_SHARE_STATE:
        return {
            ...state,
            isSharingAudio
        };

    default:
        return state;
    }
});
