import { HIDE_RECORDING_LABEL, RECORDING_STATE_UPDATED } from './actionTypes';

/**
 * Hides any displayed recording label, regardless of current recording state.
 *
 * @returns {{
 *     type: HIDE_RECORDING_LABEL
 * }}
 */
export function hideRecordingLabel() {
    return {
        type: HIDE_RECORDING_LABEL
    };
}

/**
 * Updates the redux store about the current state of the recording feature.
 *
 * @param {string} recordingState - The current state of the recording feature.
 * @returns {{
 *     type: RECORDING_STATE_UPDATED,
 *     recordingState: string
 * }}
 */
export function updateRecordingState(recordingState) {
    return {
        type: RECORDING_STATE_UPDATED,
        recordingState
    };
}
