
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_SCREEN_AUDIO_SHARE_STATE,
    SET_SCREENSHARE_CAPTURE_FRAME_RATE,
    SET_SCREENSHARE_TRACKS
} from './actionTypes';

export interface IScreenShareState {
    captureFrameRate?: number;
    desktopAudioTrack?: Object;
    isSharingAudio?: boolean;
}

/**
 * Reduces the Redux actions of the feature features/screen-share.
 */
ReducerRegistry.register<IScreenShareState>('features/screen-share', (state = {}, action): IScreenShareState => {
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
