// @flow

/**
 * The type of Redux action which clears all the data of every sessions.
 *
 * {
 *     type: CLEAR_RECORDING_SESSIONS
 * }
 * @public
 */
export const CLEAR_RECORDING_SESSIONS = 'CLEAR_RECORDING_SESSIONS';

/**
 * The type of Redux action which updates the current known state of a recording
 * session.
 *
 * {
 *     type: RECORDING_SESSION_UPDATED,
 *     sessionData: Object
 * }
 * @public
 */
export const RECORDING_SESSION_UPDATED = 'RECORDING_SESSION_UPDATED';

/**
 * The type of Redux action which sets the pending recording notification UID to
 * use it for when hiding the notification is necessary, or unsets it when
 * undefined (or no param) is passed.
 *
 * {
 *     type: SET_PENDING_RECORDING_NOTIFICATION_UID,
 *     streamType: string,
 *     uid: ?number
 * }
 * @public
 */
export const SET_PENDING_RECORDING_NOTIFICATION_UID
    = 'SET_PENDING_RECORDING_NOTIFICATION_UID';

/**
 * Sets the stream key last used by the user for later reuse.
 *
 * {
 *     type: SET_STREAM_KEY,
 *     streamKey: string
 * }
 */
export const SET_STREAM_KEY = 'SET_STREAM_KEY';
