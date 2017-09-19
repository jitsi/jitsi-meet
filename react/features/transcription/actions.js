import JitsiMeetJS from '../base/lib-jitsi-meet';

import { TRANSCRIPTION_STATE_UPDATED } from './actionTypes';

/**
 * Updates the Redux state for the transcription feature.
 *
 * @param {Object} transcriptionState - The new state to merge with the existing
 * state in Redux.
 * @returns {{
 *     type: TRANSCRIPTION_STATE_UPDATED,
 *     recordingState: string
 * }}
 */
export function updateTranscriptionState(transcriptionState
     = JitsiMeetJS.constants.transcriptionStatus.OFF) {

    return {
        type: TRANSCRIPTION_STATE_UPDATED,
        transcriptionState
    };
}
