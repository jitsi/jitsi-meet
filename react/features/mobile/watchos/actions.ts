import { SET_CONFERENCE_TIMESTAMP, SET_SESSION_ID, SET_WATCH_REACHABLE } from './actionTypes';

/**
 * Stores a timestamp when the conference is joined, so that the watch counterpart can start counting from when
 * the meeting has really started.
 *
 * @param {number} conferenceTimestamp - A timestamp retrieved with {@code newDate.getTime()}.
 * @returns {{
 *      type: SET_CONFERENCE_TIMESTAMP,
 *      conferenceTimestamp: number
 * }}
 */
export function setConferenceTimestamp(conferenceTimestamp: number) {
    return {
        type: SET_CONFERENCE_TIMESTAMP,
        conferenceTimestamp
    };
}

/**
 * Updates the session ID which is sent to the Watch app and then used by the app to send commands. Commands from
 * the watch are accepted only if the 'sessionID' passed by the Watch matches the one currently stored in Redux. It is
 * supposed to prevent from processing outdated commands.
 *
 * @returns {{
 *     type: SET_SESSION_ID,
 *     sessionID: number
 * }}
 */
export function setSessionId() {
    return {
        type: SET_SESSION_ID,
        sessionID: new Date().getTime()
    };
}

/**
 * Updates the reachable status of the watch. It's used to get in sync with the watch counterpart when it gets
 * reconnected, but also to prevent from sending updates if the app is not installed at all (which would fail with
 * an error).
 *
 * @param {boolean} isReachable - Indicates whether the watch is currently reachable or not.
 * @returns {{
 *      type: SET_WATCH_REACHABLE,
 *      watchReachable: boolean
 * }}
 */
export function setWatchReachable(isReachable: boolean) {
    return {
        type: SET_WATCH_REACHABLE,
        watchReachable: isReachable
    };
}
