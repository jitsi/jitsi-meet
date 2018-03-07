import { ADD_MESSAGE, SET_LAST_READ_MESSAGE } from './actionTypes';

/* eslint-disable max-params */

/**
 * Adds a chat message to the collection of messages.
 *
 * @param {string} userName - The username to display of the participant that
 * authored the message.
 * @param {string} message - The received message to display.
 * @param {string} timestamp - A timestamp to display for when the message was
 * received.
 * @param {boolean} hasRead - Whether or not to immediately mark the message as
 * read.
 * @returns {{
 *     type: ADD_MESSAGE,
 *     hasRead: boolean,
 *     message: string,
 *     timestamp: string,
 *     userName: string
 * }}
 */
export function addMessage(userName, message, timestamp, hasRead) {
    return {
        type: ADD_MESSAGE,
        hasRead,
        message,
        timestamp,
        userName
    };
}

/* eslint-enable max-params */

/**
 * Sets the last read message cursor to the latest message.
 *
 * @returns {Function}
 */
export function markAllRead() {
    return (dispatch, getState) => {
        const { messages } = getState()['features/chat'];

        dispatch(setLastReadMessage(messages[messages.length - 1]));
    };
}

/**
 * Updates the last read message cursor to be set at the passed in message. The
 * assumption is that messages will be ordered chronologically.
 *
 * @param {Object} message - The message from the redux state.
 * @returns {{
 *     type: SET_LAST_READ_MESSAGE,
 *     message: Object
 * }}
 */
export function setLastReadMessage(message) {
    return {
        type: SET_LAST_READ_MESSAGE,
        message
    };
}
