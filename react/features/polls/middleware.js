// @flow

import { openDialog } from '../base/dialog';
import { getLocalParticipant } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';

import { receiveAnswer, receivePoll } from './actions';
import { RECEIVE_POLL, RECEIVE_ANSWER } from './actionTypes';
import PollAnswerDialog from './components/web/PollAnswerDialog';


MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
        case RECEIVE_POLL:
            console.log('Middleware Received  poll' + action.pollId + ":" + action.poll);

            dispatch(openDialog(PollAnswerDialog));
    }

    return next(action);
});

