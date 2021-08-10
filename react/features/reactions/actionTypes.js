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
 *     type: ADD_REACTION_BUFFER,
 *     message: string,
 *     timeoutID: number
 * }
 */
export const ADD_REACTION_BUFFER = 'ADD_REACTION_BUFFER';

/**
 * The type of the action which sends the reaction buffer and resets it.
 *
 * {
 *     type: FLUSH_REACTION_BUFFER
 * }
 */
export const FLUSH_REACTION_BUFFER = 'FLUSH_REACTION_BUFFER';

/**
 * The type of the action which adds a new reaction message to the chat.
 *
 * {
 *     type: ADD_REACTION_MESSAGE,
 *     message: string,
 * }
 */
export const ADD_REACTION_MESSAGE = 'ADD_REACTION_MESSAGE';

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
export const SEND_REACTIONS = 'SEND_REACTIONS';

/**
 * The type of action to adds reactions to the queue.
 */
export const PUSH_REACTIONS = 'PUSH_REACTIONS';
