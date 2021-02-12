// @flow

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
export const ADD_MESSAGE = 'ADD_MESSAGE';

/**
 * The type of the action which signals to clear messages in Redux.
 *
 * {
 *     type: CLEAR_MESSAGES
 * }
 */
export const CLEAR_MESSAGES = 'CLEAR_MESSAGES';

/**
 * The type of the action which signals the cancelation the chat panel.
 *
 * {
 *     type: CLOSE_CHAT
 * }
 */
export const CLOSE_CHAT = 'CLOSE_CHAT';

/**
 * The type of the action which signals to display the chat panel.
 *
 * {
 *     type: OPEN_CHAT
 * }
 */
export const OPEN_CHAT = 'OPEN_CHAT';

/**
 * The type of the action which signals a send a chat message to everyone in the
 * conference.
 *
 * {
 *     type: SEND_MESSAGE,
 *     ignorePrivacy: boolean,
 *     message: string
 * }
 */
export const SEND_MESSAGE = 'SEND_MESSAGE';

/**
 * The type of action which signals the initiation of sending of as private message to the
 * supplied recipient.
 *
 * {
 *     participant: Participant,
 *     type: SET_PRIVATE_MESSAGE_RECIPIENT
 * }
 */
export const SET_PRIVATE_MESSAGE_RECIPIENT = 'SET_PRIVATE_MESSAGE_RECIPIENT';
