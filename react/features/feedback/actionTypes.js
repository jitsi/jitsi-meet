/**
 * The type of the action which signals feedback was closed without submitting.
 *
 * {
 *     type: CANCEL_FEEDBACK,
 *     message: string,
 *     score: number
 * }
 */
export const CANCEL_FEEDBACK = Symbol('CANCEL_FEEDBACK');

/**
 * The type of the action which signals whether or not the feedback dialog
 * should display at the end of a conference.
 *
 * {
 *     type: FEEDBACK_CANCEL,
 *     shouldShow: boolean
 * }
 */
export const SET_SHOULD_SHOW_POST_CALL_FEEDBACK
    = Symbol('SET_SHOULD_SHOW_POST_CALL_FEEDBACK');

/**
 * The type of the action which signals feedback was submitted for recording.
 *
 * {
 *     type: SUBMIT_FEEDBACK,
 *     message: string,
 *     score: number
 * }
 */
export const SUBMIT_FEEDBACK = Symbol('SUBMIT_FEEDBACK');
