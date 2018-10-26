/**
 * The type of Redux action triggering the transcriber to join (be 'dialed' in)
 *
 * {
 *     type: DIAL_TRANSCRIBER
 * }
 * @public
 */
export const DIAL_TRANSCRIBER = Symbol('DIAL_TRANSCRIBER');

/**
 * The type of Redux action triggering the transcriber to leave.
 *
 * {
 *     type: STOP_TRANSCRBIBING
 * }
 * @public
 */
export const STOP_TRANSCRIBING = Symbol('STOP_TRANSCRBIBING');

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
export const _TRANSCRIBER_JOINED = Symbol('TRANSCRIBER_JOINED');

/**
 * The type of Redux action signalling that the transcriber has left
 *
 * {
 *     type: TRANSCRIBER_LEFT,
 *     participantId: String
 * }
 * @private
 */
export const _TRANSCRIBER_LEFT = Symbol('TRANSCRIBER_LEFT');

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
    = Symbol('POTENTIAL_TRANSCRIBER_JOINED');

/**
 * The type of a Redux action signalling that dialing the transcriber failed.
 *
 * {
 *     type: _DIAL_ERROR,
 * }
 * @private
 */
export const _DIAL_ERROR = Symbol('DIAL_ERROR');

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
    = Symbol('SET_PENDING_TRANSCRIBING_NOTIFICATION_UID');
