/**
 * The type of the (redux) action which shows/hides the reactions menu.
 *
 * {
 *     type: TOGGLE_REACTIONS_VISIBLE,
 *     visible: boolean
 * }
 */
export const TOGGLE_REACTIONS_VISIBLE = 'TOGGLE_REACTIONS_VISIBLE';

/**
 * The type of the action which adds a new reaction to the reactions message and sets
 * a new timeout.
 *
 * {
 *     type: SET_REACTION_MESSAGE,
 *     message: string,
 *     timeoutID: number
 * }
 */
export const SET_REACTIONS_MESSAGE = 'SET_REACTIONS_MESSAGE';

/**
 * The type of the action which resets the reactions message and timeout.
 *
 * {
 *     type: CLEAR_REACTION_MESSAGE
 * }
 */
export const CLEAR_REACTIONS_MESSAGE = 'CLEAR_REACTIONS_MESSAGE';

/**
 * The type of the action which sets the reactions queue.
 *
 * {
 *     type: SET_REACTION_QUEUE,
 *     value: Array
 * }
 */
export const SET_REACTION_QUEUE = 'SET_REACTION_QUEUE';

/**
 * The type of the action which signals a send reaction to everyone in the conference.
 */
export const SEND_REACTION = 'SEND_REACTION';

/**
 * The type of the action to add a reaction message to the chat.
 */
export const ADD_REACTIONS_MESSAGE = 'ADD_REACTIONS_MESSAGE';

/**
 * The type of action to add a reaction to the queue.
 */
export const PUSH_REACTION = 'PUSH_REACTION';
