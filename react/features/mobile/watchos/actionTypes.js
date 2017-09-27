// @flow

/**
 * See {@link setConferenceTimestamp} for more details.
 * {
 *      type: SET_CONFERENCE_TIMESTAMP,
 *      conferenceTimestamp: number
 * }
 */
export const SET_CONFERENCE_TIMESTAMP = Symbol('WATCH_OS_SET_CONFERENCE_TIMESTAMP');

/**
 * See {@link setSessionId} action for more details.
 * {
 *     type: SET_SESSION_ID,
 *     sessionID: number
 * }
 */
export const SET_SESSION_ID = Symbol('WATCH_OS_SET_SESSION_ID');

/**
 * See {@link setWatchReachable} for more details.
 * {
 *     type: SET_WATCH_REACHABLE,
 *     watchReachable: boolean
 * }
 */
export const SET_WATCH_REACHABLE = Symbol('WATCH_OS_SET_WATCH_REACHABLE');
