/**
 * The type of the action which signals a request to display the inline
 * conference info dialog.
 *
 * {
 *     type: SET_INFO_DIALOG_VISIBILITY,
 *     visible: boolean
 * }
 */
export const SET_INFO_DIALOG_VISIBILITY = Symbol('SET_INFO_DIALOG_VISIBILITY');

/**
 * The type of the action which signals an error occurred while requesting dial-
 * in numbers.
 *
 * {
 *     type: UPDATE_DIAL_IN_NUMBERS_FAILED,
 *     error: Object
 * }
 */
export const UPDATE_DIAL_IN_NUMBERS_FAILED
    = Symbol('UPDATE_DIAL_IN_NUMBERS_FAILED');

/**
 * The type of the action which signals a request for dial-in numbers has
 * succeeded.
 *
 * {
 *     type: UPDATE_DIAL_IN_NUMBERS_SUCCESS,
 *     conferenceID: Object,
 *     dialInNumbers: Object
 * }
 */
export const UPDATE_DIAL_IN_NUMBERS_SUCCESS
    = Symbol('UPDATE_DIAL_IN_NUMBERS_SUCCESS');
