// @flow

import { openDialog } from '../base/dialog';
import { MiddlewareRegistry } from '../base/redux';

import { RECEIVE_POLL } from './actionTypes';
import { PollAnswerDialog } from './components';


MiddlewareRegistry.register(({ dispatch }) => next => action => {
    const result = next(action);

    switch (action.type) {

    // Middleware triggered when a poll is received
    case RECEIVE_POLL: {
        const { pollId } = action;

        dispatch(openDialog(PollAnswerDialog, { pollId }));
        break;
    }
    }

    return result;
});

