// @flow

/**
 * The type of the action which signals to update the current known state of the
 * shared URL.
 *
 * {
 *     type: SET_SHARED_URL_STATUS,
 *     status: string
 * }
 */
export const SET_SHARED_URL_STATUS = 'SET_SHARED_URL_STATUS';

/**
 * The type of the action which signals to start the flow for starting or
 * stopping a shared URL.
 *
 * {
 *     type: TOGGLE_SHARED_URL
 * }
 */
export const TOGGLE_SHARED_URL = 'TOGGLE_SHARED_URL';


/**
 * The type of the action which signals to disable or enable the shared URL
 * button.
 *
 * {
 *     type: SET_DISABLE_BUTTON
 * }
 */
export const SET_DISABLE_BUTTON = 'SET_DISABLE_BUTTON';
