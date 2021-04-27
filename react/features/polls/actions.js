// @flow

import { RECEIVE_POLL } from './actionTypes';

export const receivePoll = (id, poll) => ({ type: RECEIVE_POLL, id, poll });
