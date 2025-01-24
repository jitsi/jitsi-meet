import { IStore } from '../app/types';
import { ENDPOINT_MESSAGE_RECEIVED, NON_PARTICIPANT_MESSAGE_RECEIVED } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound } from '../base/sounds/actions';
import { INCOMING_MSG_SOUND_ID } from '../chat/constants';
import { arePollsDisabled } from '../conference/functions.any';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';

import { RECEIVE_POLL } from './actionTypes';
import { clearPolls, receiveAnswer, receivePoll } from './actions';
import {
    COMMAND_ANSWER_POLL,
    COMMAND_NEW_POLL,
    COMMAND_OLD_POLLS
} from './constants';
import { IAnswer, IPoll, IPollData } from './types';

/**
 * The maximum number of answers a poll can have.
 */
const MAX_ANSWERS = 32;

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Clear messages or close the chat modal if it's left
 * open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference): void => {
        if (conference !== previousConference) {
            dispatch(clearPolls());
        }
    });

const parsePollData = (pollData: Partial<IPollData>): IPoll | null => {
    if (typeof pollData !== 'object' || pollData === null) {
        return null;
    }
    const { id, senderId, question, answers } = pollData;

    if (typeof id !== 'string' || typeof senderId !== 'string'
        || typeof question !== 'string' || !(answers instanceof Array)) {
        return null;
    }

    return {
        changingVote: false,
        senderId,
        question,
        showResults: true,
        lastVote: null,
        answers,
        saved: false,
        editing: false
    };
};

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case ENDPOINT_MESSAGE_RECEIVED: {
        const { participant, data } = action;
        const isNewPoll = data.type === COMMAND_NEW_POLL;

        _handleReceivePollsMessage({
            ...data,
            senderId: isNewPoll ? participant.getId() : undefined,
            voterId: isNewPoll ? undefined : participant.getId()
        }, dispatch, getState);

        break;
    }

    case NON_PARTICIPANT_MESSAGE_RECEIVED: {
        const { id, json: data } = action;
        const isNewPoll = data.type === COMMAND_NEW_POLL;

        _handleReceivePollsMessage({
            ...data,
            senderId: isNewPoll ? id : undefined,
            voterId: isNewPoll ? undefined : id
        }, dispatch, getState);
        break;
    }

    case RECEIVE_POLL: {
        const state = getState();

        if (arePollsDisabled(state)) {
            break;
        }

        const isChatOpen: boolean = state['features/chat'].isOpen;
        const isPollsTabFocused: boolean = state['features/chat'].isPollsTabFocused;

        // Finally, we notify user they received a new poll if their pane is not opened
        if (action.notify && (!isChatOpen || !isPollsTabFocused)) {
            dispatch(playSound(INCOMING_MSG_SOUND_ID));
        }
        break;
    }
    }

    return result;
});

/**
 * Handles receiving of polls message command.
 *
 * @param {Object} data - The json data carried by the polls message.
 * @param {Function} dispatch - The dispatch function.
 * @param {Function} getState - The getState function.
 *
 * @returns {void}
 */
function _handleReceivePollsMessage(data: any, dispatch: IStore['dispatch'], getState: IStore['getState']) {
    if (arePollsDisabled(getState())) {
        return;
    }

    switch (data.type) {

    case COMMAND_NEW_POLL: {
        const { pollId, answers, senderId, question } = data;
        const tmp = {
            id: pollId,
            answers,
            question,
            senderId
        };

        // Check integrity of the poll data.
        // TODO(saghul): we should move this to the server side, likely by storing the
        // poll data in the room metadata.
        if (parsePollData(tmp) === null) {
            return;
        }

        const poll = {
            changingVote: false,
            senderId,
            showResults: false,
            lastVote: null,
            question,
            answers: answers.map((answer: string) => {
                return {
                    name: answer,
                    voters: []
                };
            }).slice(0, MAX_ANSWERS),
            saved: false,
            editing: false
        };

        dispatch(receivePoll(pollId, poll, true));
        dispatch(showNotification({
            appearance: NOTIFICATION_TYPE.NORMAL,
            titleKey: 'polls.notification.title',
            descriptionKey: 'polls.notification.description'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        break;

    }

    case COMMAND_ANSWER_POLL: {
        const { pollId, answers, voterId } = data;

        const receivedAnswer: IAnswer = {
            voterId,
            pollId,
            answers: answers.slice(0, MAX_ANSWERS)
        };

        dispatch(receiveAnswer(pollId, receivedAnswer));
        break;

    }

    case COMMAND_OLD_POLLS: {
        const { polls } = data;

        for (const pollData of polls) {
            const poll = parsePollData(pollData);

            if (poll === null) {
                console.warn('[features/polls] Invalid old poll data');
            } else {
                dispatch(receivePoll(pollData.id, poll, false));
            }
        }
        break;
    }
    }
}
