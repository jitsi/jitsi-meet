// @flow

import type {Answer, Poll} from './types';
import { RECEIVE_ANSWER, RECEIVE_POLL,  } from './actionTypes';

export const receivePoll = (pollId: string, poll: Poll) => (
    {
        type: RECEIVE_POLL,
        pollId,
        poll
    }
    );

export const receiveAnswer = (pollId: string, answer: Answer) => (
    {
        type: RECEIVE_ANSWER,
        pollId,
        answer
    }
);
