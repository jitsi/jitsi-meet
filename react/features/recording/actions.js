// @flow

import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import {
    showErrorNotification
} from '../notifications';

import {
    CLEAR_RECORDING_SESSIONS,
    RECORDING_SESSION_UPDATED,
    SET_STREAM_KEY
} from './actionTypes';

/**
 * Clears the data of every recording sessions.
 *
 * @returns {{
 *     type: CLEAR_RECORDING_SESSIONS
 * }}
 */
export function clearRecordingSessions() {
    return {
        type: CLEAR_RECORDING_SESSIONS
    };
}

/**
 * Sets the stream key last used by the user for later reuse.
 *
 * @param {string} streamKey - The stream key to set.
 * @returns {{
 *     type: SET_STREAM_KEY,
 *     streamKey: string
 * }}
 */
export function setLiveStreamKey(streamKey: string) {
    return {
        type: SET_STREAM_KEY,
        streamKey
    };
}

/**
 * Signals that the recording error notification should be shown.
 *
 * @param {Object} props - The Props needed to render the notification.
 * @returns {showErrorNotification}
 */
export function showRecordingError(props: Object) {
    return showErrorNotification(props);
}

/**
 * Updates the known state for a given recording session.
 *
 * @param {Object} session - The new state to merge with the existing state in
 * redux.
 * @returns {{
 *     type: RECORDING_SESSION_UPDATED,
 *     sessionData: Object
 * }}
 */
export function updateRecordingSessionData(session: Object) {
    const status = session.getStatus();
    const timestamp
        = status === JitsiRecordingConstants.status.ON
            ? Date.now() / 1000
            : undefined;

    return {
        type: RECORDING_SESSION_UPDATED,
        sessionData: {
            error: session.getError(),
            id: session.getID(),
            initiator: session.getInitiator(),
            liveStreamViewURL: session.getLiveStreamViewURL(),
            mode: session.getMode(),
            status,
            terminator: session.getTerminator(),
            timestamp
        }
    };
}
