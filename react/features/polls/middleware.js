// @flow

import { openDialog } from '../base/dialog';
import { getLocalParticipant, getParticipantDisplayName } from '../base/participants/functions';
import { MiddlewareRegistry } from '../base/redux';
import { addMessage, MESSAGE_TYPE_LOCAL, MESSAGE_TYPE_REMOTE } from '../chat';

import { RECEIVE_POLL, SHOW_POLL } from './actionTypes';
import { showPoll } from './actions';
import { PollAnswerDialog } from './components';


MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {

    // Middleware triggered when a poll is received
    case RECEIVE_POLL: {
        const { poll, pollId, queue } = action;

        const state = getState();
        const senderName = getParticipantDisplayName(state, poll.senderId);
        const localParticipant = getLocalParticipant(state);
        const localName = getParticipantDisplayName(state, localParticipant.id);
        const isLocal = poll.senderId === localParticipant.id;
        const isChatOpen: boolean = state['features/chat'].isOpen;

        dispatch(addMessage({
            displayName: senderName,
            hasRead: isChatOpen,
            id: poll.senderId,
            messageType: isLocal ? MESSAGE_TYPE_LOCAL : MESSAGE_TYPE_REMOTE,
            message: '[Poll]',
            pollId,
            privateMessage: false,
            recipient: localName,
            timestamp: Date.now()
        }));

        if (!queue && !poll.answered) {
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

