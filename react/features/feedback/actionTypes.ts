/**
 * The type of the action which signals feedback was closed without submitting.
 *
 * {
 *     type: CANCEL_FEEDBACK,
 *     message: string,
 *     score: number
 * }
 */
export const CANCEL_FEEDBACK = 'CANCEL_FEEDBACK';

/**
 * The type of the action which signals feedback failed to be recorded.
 *
 * {
 *     type: SUBMIT_FEEDBACK_ERROR
 *     error: string
 * }
 */
export const SUBMIT_FEEDBACK_ERROR = 'SUBMIT_FEEDBACK_ERROR';

/**
 * The type of the action which signals feedback has been recorded.
 *
 * {
 *     type: SUBMIT_FEEDBACK_SUCCESS,
 * }
 */
export const SUBMIT_FEEDBACK_SUCCESS = 'SUBMIT_FEEDBACK_SUCCESS';
