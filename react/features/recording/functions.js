// @flow

import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';

import { RECORDING_STATUS_PRIORITIES } from './constants';

/**
 * Searches in the passed in redux state for an active recording session of the
 * passed in mode.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} mode - Find an active recording session of the given mode.
 * @returns {Object|undefined}
 */
export function getActiveSession(state: Object, mode: string) {
    const { sessionDatas } = state['features/recording'];
    const { status: statusConstants } = JitsiRecordingConstants;

    return sessionDatas.find(sessionData => sessionData.mode === mode
        && (sessionData.status === statusConstants.ON
            || sessionData.status === statusConstants.PENDING));
}

/**
 * Returns an estimated recording duration based on the size of the video file
 * in MB. The estimate is calculated under the assumption that 1 min of recorded
 * video needs 10MB of storage on avarage.
 *
 * @param {number} size - The size in MB of the recorded video.
 * @returns {number} - The estimated duration in minutes.
 */
export function getRecordingDurationEstimation(size: ?number) {
    return Math.floor((size || 0) / 10);
}

/**
 * Searches in the passed in redux state for a recording session that matches
 * the passed in recording session ID.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} id - The ID of the recording session to find.
 * @returns {Object|undefined}
 */
export function getSessionById(state: Object, id: string) {
    return state['features/recording'].sessionDatas.find(
        sessionData => sessionData.id === id);
}

/**
 * Returns the recording session status that is to be shown in a label. E.g. If
 * there is a session with the status OFF and one with PENDING, then the PENDING
 * one will be shown, because that is likely more important for the user to see.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} mode - The recording mode to get status for.
 * @returns {string|undefined}
 */
export function getSessionStatusToShow(state: Object, mode: string): ?string {
    const recordingSessions = state['features/recording'].sessionDatas;
    let status;

    if (Array.isArray(recordingSessions)) {
        for (const session of recordingSessions) {
            if (session.mode === mode
                    && (!status
                        || (RECORDING_STATUS_PRIORITIES.indexOf(session.status)
                            > RECORDING_STATUS_PRIORITIES.indexOf(status)))) {
                status = session.status;
            }
        }
    }

    return status;
}
