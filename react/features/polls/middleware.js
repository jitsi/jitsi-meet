// @flow

import { openDialog } from '../base/dialog';
import { MiddlewareRegistry } from '../base/redux';

import { RECEIVE_POLL, SHOW_POLL } from './actionTypes';
import { showPoll } from './actions';
import { PollAnswerDialog } from './components';


MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {

    // Middleware triggered when a poll is received
    case RECEIVE_POLL: {
        const { pollId, queue } = action;

        if (!queue) {
            dispatch(showPoll(pollId));
        }
        break;
    }

    case SHOW_POLL: {
        const { pollId } = action;

        dispatch(openDialog(PollAnswerDialog, { pollId }));
        break;
    }

    case 'HIDE_DIALOG': {
        const queue = getState()['features/polls'].pollQueue;

        if (queue.length > 0) {
            dispatch(showPoll(queue[0]));
        }
        break;
    }
    }

    return result;
});

