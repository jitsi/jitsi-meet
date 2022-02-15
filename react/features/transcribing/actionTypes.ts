/**
 * The type of Redux action triggering storage of participantId of transcriber,
 * so that it can later be kicked
 *
 * {
 *     type: TRANSCRIBER_JOINED,
 *     participantId: String
 * }
 * @private
 */
export const _TRANSCRIBER_JOINED = 'TRANSCRIBER_JOINED';

/**
 * The type of Redux action signalling that the transcriber has left
 *
 * {
 *     type: TRANSCRIBER_LEFT,
 *     participantId: String
 * }
 * @private
 */
export const _TRANSCRIBER_LEFT = 'TRANSCRIBER_LEFT';

/**
 * The type of a Redux action signalling that a hidden participant has joined,
 * which can be candidate for being a transcriber.
 *
 * {
 *     type: _POTENTIAL_TRANSCRIBER_JOINED,
 * }
 * @private
 */
export const _POTENTIAL_TRANSCRIBER_JOINED
    = 'POTENTIAL_TRANSCRIBER_JOINED';

/**
 * The type of Redux action which sets the pending transcribing notification UID
 * to use it for when hiding the notification is necessary, or unsets it when
 * undefined (or no param) is passed.
 *
 * {
 *     type: SET_PENDING_TRANSCRIBING_NOTIFICATION_UID,
 *     uid: ?number
 * }
 * @public
 */
export const SET_PENDING_TRANSCRIBING_NOTIFICATION_UID
    = 'SET_PENDING_TRANSCRIBING_NOTIFICATION_UID';
