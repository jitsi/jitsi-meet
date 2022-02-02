
import { ReducerRegistry } from '../base/redux';

import { SET_SCREEN_AUDIO_SHARE_STATE, SET_SCREENSHARE_CAPTURE_FRAME_RATE } from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/screen-share.
 */
ReducerRegistry.register('features/screen-share', (state = {}, action) => {
    const { captureFrameRate, isSharingAudio } = action;

    switch (action.type) {
    case SET_SCREEN_AUDIO_SHARE_STATE:
        return {
            ...state,
            isSharingAudio
        };

    case SET_SCREENSHARE_CAPTURE_FRAME_RATE:
        return {
            ...state,
            captureFrameRate
        };

    default:
        return state;
    }
});
