// @flow

import { RECEIVE_POLL } from './actionTypes';

export const receivePoll = (id, poll) => {
    return { type: RECEIVE_POLL,
        id,
        poll };
};
