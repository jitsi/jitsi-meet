import { RECORDING_SESSION_UPDATED } from './actionTypes';

/**
 * Updates the known state for a given recording session.
 *
 * @param {Object} session - The new state to merge with the existing
 * state in redux.
 * @returns {{
 *     type: RECORDING_SESSION_UPDATED,
 *     session: Object
 * }}
 */
export function updateRecordingSession(session) {
    return {
        type: RECORDING_SESSION_UPDATED,
        session: {
            error: session.getError(),
            id: session.getID(),
            liveStreamViewURL: session.getLiveStreamViewURL(),
            mode: session.getMode(),
            status: session.getStatus()
        }
    };
}
