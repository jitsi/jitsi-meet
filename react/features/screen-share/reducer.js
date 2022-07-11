
import { ReducerRegistry } from '../base/redux';

import {
    SET_SCREEN_AUDIO_SHARE_STATE,
    SET_SCREENSHARE_CAPTURE_FRAME_RATE,
    SET_SCREENSHARE_TRACKS
} from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/screen-share.
 */
ReducerRegistry.register('features/screen-share', (state = {}, action) => {
    const { captureFrameRate, isSharingAudio, desktopAudioTrack } = action;

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

    case SET_SCREENSHARE_TRACKS:
        return {
            ...state,
            desktopAudioTrack
        };

    default:
        return state;
    }
});
