// @flow

import {
    CLOSE_POLL_TAB,
    RECEIVE_ANSWER,
    RECEIVE_POLL,
    SET_ANSWERED_STATUS
} from './actionTypes';
import type { Answer, Poll } from './types';

/**
 * Action to signal that a new poll was received.
 *
 * @param {string} pollId - The id of the incoming poll.
 * @param {Poll} poll - The incoming Poll object.
 * @param {boolean} notify - Whether to send or not a notification.
 * @returns {{
 *     type: RECEIVE_POLL,
 *     poll: Poll,
 *     pollId: string,
 *     notify: boolean
 * }}
 */
export const receivePoll = (pollId: string, poll: Poll, notify: boolean) => {
    return {
        type: RECEIVE_POLL,
        poll,
        pollId,
        notify
    };
};

/**
 * Action to signal that a new answer was received.
 *
 * @param {string} pollId - The id of the incoming poll.
 * @param {Answer} answer - The incoming Answer object.
 * @returns {{
 *     type: RECEIVE_ANSWER,
 *     answer: Answer,
 *     pollId: string
 * }}
 */
export const receiveAnswer = (pollId: string, answer: Answer) => {
    return {
        type: RECEIVE_ANSWER,
        answer,
        pollId
    };
};

/**
 * Action to set the answer status of a poll.
 *
 * @param {string} pollId - The id of the poll.
 * @param {boolean} answered - The new answer status.
 * @returns {{
 *     type: SET_ANSWERED_STATUS,
 *     answered: boolean,
 *     pollId: string
 * }}
 */
export const setAnsweredStatus = (pollId: string, answered: boolean) => {
    return {
        type: SET_ANSWERED_STATUS,
        answered,
        pollId
    };
};


/**
 * Action to signal the closing of the chat dialog.
 *
 * @returns {{
 *     type: CLOSE_CHAT
 * }}
 */
export function closePollTab() {
    return {
        type: CLOSE_POLL_TAB
    };
}
