import {
    HIDE_RECORDING_LABEL,
    RECORDING_STATE_UPDATED,
    SET_RECORDING_TYPE,
    TOGGLE_RECORDING
} from './actionTypes';

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
 * Sets what type of recording service will be used.
 *
 * @param {string} recordingType - The type of recording service to be used.
 * Should be one of the enumerated types in {@link RECORDING_TYPES}.
 * @returns {{
 *     type: SET_RECORDING_TYPE,
 *     recordingType: string
 * }}
 */
export function setRecordingType(recordingType) {
    return {
        type: SET_RECORDING_TYPE,
        recordingType
    };
}

/**
 * Start or stop recording.
 *
 * @returns {{
 *     type: TOGGLE_RECORDING
 * }}
 */
export function toggleRecording() {
    return {
        type: TOGGLE_RECORDING
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
