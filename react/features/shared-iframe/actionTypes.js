/**
 * The type of the action which update the state without any side effects.
 *
 * @example
 * {
 *     type: ONLY_UPDATE_SHARED_IFRAME_STATUS,
 *     status: string
 * }
 */
export const ONLY_UPDATE_SHARED_IFRAME_STATUS = 'ONLY_UPDATE_SHARED_IFRAME_STATUS';

/**
 * The type of the action which signals to update the current known state of the
 * shared iframe.
 *
 * @example
 * {
 *     type: SET_SHARED_IFRAME_STATUS,
 *     status: string
 * }
 */
export const SET_SHARED_IFRAME_STATUS = 'SET_SHARED_IFRAME_STATUS';

/**
 * The type of the action which signals to reset the current known state of the
 * shared IFRAME.
 *
 * @example
 * {
 *     type: RESET_SHARED_IFRAME_STATUS,
 * }
 */
export const RESET_SHARED_IFRAME_STATUS = 'RESET_SHARED_IFRAME_STATUS';

/**
 * The type of the action which signals to disable or enable the shared iframe
 * button.
 *
 * @example
 * {
 *     type: SET_DISABLE_SHARED_IFRAME_BUTTON
 * }
 */
export const SET_DISABLE_SHARED_IFRAME_BUTTON = 'SET_DISABLE_SHARED_IFRAME_BUTTON';
