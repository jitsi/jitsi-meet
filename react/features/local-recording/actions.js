/* @flow */

import {
    LOCAL_RECORDING_ENGAGED,
    LOCAL_RECORDING_UNENGAGED,
    LOCAL_RECORDING_STATS_UPDATE
} from './actionTypes';

// The following two actions signal state changes in local recording engagement.
// In other words, the events of the local WebWorker / MediaRecorder starting to
// record and finishing recording.
// Note that this is not the event fired when the users tries to start the
// recording in the UI.

/**
 * Signals that local recording has been engaged.
 *
 * @param {Date} startTime - Time when the recording is engaged.
 * @returns {{
 *     type: LOCAL_RECORDING_ENGAGED,
 *     recordingEngagedAt: Date
 * }}
 */
export function localRecordingEngaged(startTime: Date) {
    return {
        type: LOCAL_RECORDING_ENGAGED,
        recordingEngagedAt: startTime
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
