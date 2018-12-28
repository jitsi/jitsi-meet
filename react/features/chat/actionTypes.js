/**
 * The type of the action which signals to add a new chat message.
 *
 * {
 *     type: ADD_MESSAGE,
 *     displayName: string
 *     hasRead: boolean,
 *     id: string,
 *     messageType: string,
 *     message: string,
 *     timestamp: string,
 * }
 */
export const ADD_MESSAGE = Symbol('ADD_MESSAGE');

/**
 * The type of the action which signals a send a chat message to everyone in the
 * conference.
 *
 * {
 *     type: SEND_MESSAGE,
 *     message: string
 * }
 */
export const SEND_MESSAGE = Symbol('SEND_MESSAGE');

/**
 * The type of the action which signals to toggle the display of the chat panel.
 *
 * {
 *     type: TOGGLE_CHAT
 * }
 */
export const TOGGLE_CHAT = Symbol('TOGGLE_CHAT');
