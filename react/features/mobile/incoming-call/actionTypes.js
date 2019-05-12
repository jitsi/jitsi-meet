/**
 * The type of redux action to answer an incoming call.
 *
 * {
 *     type: INCOMING_CALL_ANSWERED
 * }
 */
export const INCOMING_CALL_ANSWERED = 'INCOMING_CALL_ANSWERED';

/**
 * The type of redux action to decline an incoming call.
 *
 * {
 *     type: INCOMING_CALL_DECLINED
 * }
 */
export const INCOMING_CALL_DECLINED = 'INCOMING_CALL_DECLINED';

/**
 * The type of redux action to receive an incoming call.
 *
 * {
 *     type: INCOMING_CALL_RECEIVED,
 *     caller: Object
 * }
 */
export const INCOMING_CALL_RECEIVED = 'INCOMING_CALL_RECEIVED';
