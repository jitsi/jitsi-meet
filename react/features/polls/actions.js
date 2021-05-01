// @flow

import { RECEIVE_ANSWER, RECEIVE_POLL } from './actionTypes';
import type { Answer, Poll } from './types';

/**
 * Action to signal that a new poll was received.
 *
 * @param {string} pollId - The id of the incoming poll.
 * @param {Poll} poll - The incoming Poll object.
 * @returns {{
 *     type: RECEIVE_POLL,
 *     poll: Poll,
 *     pollId: string
 * }}
 */
export const receivePoll = (pollId: string, poll: Poll) => {
    return {
        type: RECEIVE_POLL,
        poll,
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
