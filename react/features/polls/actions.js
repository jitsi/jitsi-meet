// @flow

import { RECEIVE_ANSWER, RECEIVE_POLL, SET_ANSWERED_STATUS, SHOW_POLL } from './actionTypes';
import type { Answer, Poll } from './types';

/**
 * Action to signal that a new poll was received.
 *
 * @param {string} pollId - The id of the incoming poll.
 * @param {Poll} poll - The incoming Poll object.
 * @param {boolean} queue - Whether to queue the poll or show modal immediately.
 * @returns {{
 *     type: RECEIVE_POLL,
 *     poll: Poll,
 *     pollId: string,
 *     queue: boolean
 * }}
 */
export const receivePoll = (pollId: string, poll: Poll, queue: boolean) => {
    return {
        type: RECEIVE_POLL,
        poll,
        pollId,
        queue
    };
};

/**
 * Action to signal that a poll answer modal should be shown.
 *
 * @param {string} pollId - The id of the poll to be shown.
 * @returns {{
 *     type: SHOW_POLL,
 *     pollId: string
 * }}
 */
export const showPoll = (pollId: string) => {
    return {
        type: SHOW_POLL,
        pollId
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
