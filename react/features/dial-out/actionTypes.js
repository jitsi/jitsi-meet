/**
 * The type of the action which signals a check for a dial-out phone number has
 * succeeded.
 *
 * {
 *     type: PHONE_NUMBER_CHECKED,
 *     response: Object
 * }
 */
export const PHONE_NUMBER_CHECKED
    = Symbol('PHONE_NUMBER_CHECKED');

/**
 * The type of the action which signals a cancel of the dial-out operation.
 *
 * {
 *     type: DIAL_OUT_CANCELED,
 *     response: Object
 * }
 */
export const DIAL_OUT_CANCELED
    = Symbol('DIAL_OUT_CANCELED');

/**
 * The type of the action which signals a request for dial-out country codes has
 * succeeded.
 *
 * {
 *     type: DIAL_OUT_CODES_UPDATED,
 *     response: Object
 * }
 */
export const DIAL_OUT_CODES_UPDATED
    = Symbol('DIAL_OUT_CODES_UPDATED');

/**
 * The type of the action which signals a failure in some of dial-out service
 * requests.
 *
 * {
 *     type: DIAL_OUT_SERVICE_FAILED,
 *     response: Object
 * }
 */
export const DIAL_OUT_SERVICE_FAILED
    = Symbol('DIAL_OUT_SERVICE_FAILED');
