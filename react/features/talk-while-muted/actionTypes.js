/**
 * The type of Redux action which sets the pending notification UID
 * to use it for when hiding the notification is necessary, or unsets it when
 * undefined (or no param) is passed.
 *
 * {
 *     type: SET_CURRENT_NOTIFICATION_UID,
 *     uid: ?number
 * }
 * @public
 */
export const SET_CURRENT_NOTIFICATION_UID = 'SET_CURRENT_NOTIFICATION_UID';

export const TALK_WHILE_MUTED = 'TALK_WHILE_MUTED';
