import { IStore } from '../app/types';
import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound } from '../base/sounds/actions';
import { INCOMING_MSG_SOUND_ID } from '../chat/constants';
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

const parsePollData = (pollData: IPollData): IPoll | null => {
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
        answers
    };
};

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;

        conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            (user: any, data: any) => {
                const isNewPoll = data.type === COMMAND_NEW_POLL;

                _handleReceivePollsMessage({
                    ...data,
                    senderId: isNewPoll ? user._id : undefined,
                    voterId: isNewPoll ? undefined : user._id
                }, dispatch);
            });
        conference.on(JitsiConferenceEvents.NON_PARTICIPANT_MESSAGE_RECEIVED,
            (id: any, data: any) => {
                const isNewPoll = data.type === COMMAND_NEW_POLL;

                _handleReceivePollsMessage({
                    ...data,
                    senderId: isNewPoll ? id : undefined,
                    voterId: isNewPoll ? undefined : id
                }, dispatch);
            });

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
function _handleReceivePollsMessage(data: any, dispatch: IStore['dispatch']) {
    switch (data.type) {
    case COMMAND_NEW_POLL: {
        const { question, answers, pollId, senderId } = data;

        const poll = {
            changingVote: false,
            senderId,
            showResults: false,
            lastVote: null,
            question,
            answers: answers.map((answer: IAnswer) => {
                return {
                    name: answer,
                    voters: []
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
        const { pollId, answers, voterId } = data;

        const receivedAnswer: IAnswer = {
            voterId,
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
