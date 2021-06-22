// @flow

import { SET_SCREEN_AUDIO_SHARE_STATE } from './actionTypes';

/**
 * Updates the current known status of the shared video.
 *
 * @param {boolean} isSharingAudio - Is audio currently being shared or not.
 * @returns {{
 *     type: SET_SCREEN_AUDIO_SHARE_STATE,
 *     isSharingAudio: boolean
 * }}
 */
export function setScreenAudioShareState(isSharingAudio: boolean) {
    return {
        type: SET_SCREEN_AUDIO_SHARE_STATE,
        isSharingAudio
    };
}
