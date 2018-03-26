/**
 * The type of the action which signals to add a new chat message.
 *
 * {
 *     type: ADD_MESSAGE,
 *     hasRead: boolean,
 *     message: string,
 *     timestamp: string,
 *     userName: string
 * }
 */
export const ADD_MESSAGE = Symbol('ADD_MESSAGE');

/**
 * The type of the action which updates which is the most recent message that
 * has been seen by the local participant.
 *
 * {
 *     type: SET_LAST_READ_MESSAGE,
 *     message: Object
 * }
 */
export const SET_LAST_READ_MESSAGE = Symbol('SET_LAST_READ_MESSAGE');
