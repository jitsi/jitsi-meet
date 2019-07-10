/**
 * The type of (redux) action which signals that an event listener has been
 * added to listen for any user interaction with the page.
 *
 * {
 *     type: SET_USER_INTERACTION_LISTENER,
 *     userInteractionListener: Function
 * }
 */
export const SET_USER_INTERACTION_LISTENER = 'SET_USER_INTERACTION_LISTENER';

/**
 * The type of (redux) action which signals the user has interacted with the
 * page.
 *
 * {
 *     type: USER_INTERACTION_RECEIVED,
 * }
 */
export const USER_INTERACTION_RECEIVED = 'USER_INTERACTION_RECEIVED';
