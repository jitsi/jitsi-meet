// @flow

import { getCurrentConference } from '../base/conference';
import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { playSound } from '../base/sounds';
import { INCOMING_MSG_SOUND_ID } from '../chat/constants';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    showNotification
} from '../notifications';

import { RECEIVE_POLL } from './actionTypes';
import { clearPolls, receiveAnswer, receivePoll } from './actions';
import {
    COMMAND_ANSWER_POLL,
    COMMAND_NEW_POLL,
    COMMAND_OLD_POLLS
} from './constants';
import type { Answer, Poll } from './types';

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Clear messages or close the chat modal if it's left
 * open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference) => {
        if (conference !== previousConference) {
            // conference changed, left or failed...
            // clean old polls
            dispatch(clearPolls());
        }
    });

const parsePollData = (pollData): Poll | null => {
    if (typeof pollData !== 'object' || pollData === null) {
        return null;
    }
    const { id, senderId, senderName, question, answers } = pollData;

    if (typeof id !== 'string' || typeof senderId !== 'string' || typeof senderName !== 'string'
        || typeof question !== 'string' || !(answers instanceof Array)) {
        return null;
    }

    const answersParsed = [];

    for (const answer of answers) {
        const voters = new Map();

        for (const [ voterId, voter ] of Object.entries(answer.voters)) {
            if (typeof voter !== 'string') {
                return null;
            }
            voters.set(voterId, voter);
        }

        answersParsed.push({
            name: answer.name,
            voters
        });
    }

    return {
        changingVote: false,
        senderId,
        senderName,
        question,
        showResults: true,
        lastVote: null,
        answers: answersParsed
    };
};

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;

        conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            (_, data) => _handleReceivePollsMessage(data, dispatch));
        conference.on(JitsiConferenceEvents.NON_PARTICIPANT_MESSAGE_RECEIVED,
            (_, data) => _handleReceivePollsMessage(data, dispatch));

        break;
    }

    // Middleware triggered when a poll is received
    case RECEIVE_POLL: {

        const state = getState();
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
 *
 * @returns {void}
 */
function _handleReceivePollsMessage(data, dispatch) {
    switch (data.type) {
    case COMMAND_NEW_POLL: {
        const { question, answers, pollId, senderId, senderName } = data;

        const poll = {
            changingVote: false,
            senderId,
            senderName,
            showResults: false,
            lastVote: null,
            question,
            answers: answers.map(answer => {
                return {
                    name: answer,
                    voters: new Map()
                };
            })
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
        const { pollId, answers, voterId, voterName } = data;

        const receivedAnswer: Answer = {
            voterId,
            voterName,
            pollId,
            answers
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
