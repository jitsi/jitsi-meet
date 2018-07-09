/* @flow */

import {
    LOCAL_RECORDING_ENGAGED,
    LOCAL_RECORDING_UNENGAGED,
    LOCAL_RECORDING_TOGGLE_DIALOG,
    LOCAL_RECORDING_STATS_UPDATE
} from './actionTypes';

// The following two actions signal state changes in local recording engagement.
// In other words, the events of the local WebWorker / MediaRecorder starting to
// record and finishing recording.
// Note that this is not the event fired when the users tries to start the
// recording in the UI.

/**
 * Signals that local recording has started.
 *
 * @returns {{
 *     type: LOCAL_RECORDING_ENGAGED
 * }}
 */
export function localRecordingEngaged() {
    return {
        type: LOCAL_RECORDING_ENGAGED
    };
}

/**
 * Signals that local recording has finished.
 *
 * @returns {{
 *     type: LOCAL_RECORDING_UNENGAGED
 * }}
 */
export function localRecordingUnengaged() {
    return {
        type: LOCAL_RECORDING_UNENGAGED
    };
}

/**
 * Toggles the open/close state of {@code LocalRecordingInfoDialog}.
 *
 * @returns {{
 *     type: LOCAL_RECORDING_TOGGLE_DIALOG
 * }}
 */
export function toggleLocalRecordingInfoDialog() {
    return {
        type: LOCAL_RECORDING_TOGGLE_DIALOG
    };
}

/**
 * Updates the the local recording stats from each client,
 * to be displayed on {@code LocalRecordingInfoDialog}.
 *
 * @param {*} stats - The stats object.
 * @returns {{
 *     type: LOCAL_RECORDING_STATS_UPDATE,
 *     stats: Object
 * }}
 */
export function statsUpdate(stats: Object) {
    return {
        type: LOCAL_RECORDING_STATS_UPDATE,
        stats
    };
}
