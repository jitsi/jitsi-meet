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
 * Updates the redux state for the recording feature.
 *
 * @param {Object} recordingState - The new state to merge with the existing
 * state in redux.
 * @returns {{
 *     type: RECORDING_STATE_UPDATED,
 *     recordingState: Object
 * }}
 */
export function updateRecordingState(recordingState = {}) {
    return {
        type: RECORDING_STATE_UPDATED,
        recordingState
    };
}
