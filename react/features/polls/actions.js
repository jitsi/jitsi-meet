// @flow

import { RECEIVE_ANSWER, RECEIVE_POLL } from './actionTypes';
import type { Answer, Poll } from './types';

export const receivePoll = (pollId: string, poll: Poll) => {
    return {
        type: RECEIVE_POLL,
        pollId,
        poll
    };
};

export const receiveAnswer = (pollId: string, answer: Answer) => {
    return {
        type: RECEIVE_ANSWER,
        pollId,
        answer
    };
};
