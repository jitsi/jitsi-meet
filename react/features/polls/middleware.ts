import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getParticipantById, getParticipantDisplayName } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound } from '../base/sounds/actions';
import { ChatTabs, INCOMING_MSG_SOUND_ID } from '../chat/constants';
import { arePollsDisabled } from '../conference/functions.any';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';

import { RECEIVE_POLL } from './actionTypes';
import { clearPolls, receiveAnswer, receivePoll } from './actions';
import { IIncomingAnswerData } from './types';

/**
 * The maximum number of answers a poll can have.
 */
const MAX_ANSWERS = 32;

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Clear messages or close the chat modal if it's left
 * open.
 * When joining new conference set up the listeners for polls.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, previousConference): void => {
        if (conference !== previousConference) {
            dispatch(clearPolls());

            if (conference && !previousConference) {
                conference.on(JitsiConferenceEvents.POLL_RECEIVED, (data: any) => {
                    _handleReceivedPollsData(data, dispatch, getState);
                });
                conference.on(JitsiConferenceEvents.POLL_ANSWER_RECEIVED, (data: any) => {
                    _handleReceivedPollsAnswer(data, dispatch, getState);
                });
            }
        }
    });

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {

    case RECEIVE_POLL: {
        const state = getState();

        if (arePollsDisabled(state)) {
            break;
        }

        const isChatOpen: boolean = state['features/chat'].isOpen;
        const isPollsTabFocused: boolean = state['features/chat'].focusedTab === ChatTabs.POLLS;

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
 * Handles receiving of new or history polls to load.
 *
 * @param {Object} data - The json data carried by the polls message.
 * @param {Function} dispatch - The dispatch function.
 * @param {Function} getState - The getState function.
 *
 * @returns {void}
 */
function _handleReceivedPollsData(data: any, dispatch: IStore['dispatch'], getState: IStore['getState']) {
    if (arePollsDisabled(getState())) {
        return;
    }

    const { pollId, answers, senderId, question, history } = data;
    const poll = {
        changingVote: false,
        senderId,
        showResults: false,
        lastVote: null,
        question,
        answers: answers.slice(0, MAX_ANSWERS),
        saved: false,
        editing: false,
        pollId
    };

    dispatch(receivePoll(poll, !history));

    if (!history) {
        dispatch(showNotification({
            appearance: NOTIFICATION_TYPE.NORMAL,
            titleKey: 'polls.notification.title',
            descriptionKey: 'polls.notification.description'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
    }
}

/**
 * Handles receiving of pools answers.
 *
 * @param {Object} data - The json data carried by the polls message.
 * @param {Function} dispatch - The dispatch function.
 * @param {Function} getState - The getState function.
 *
 * @returns {void}
 */
function _handleReceivedPollsAnswer(data: any, dispatch: IStore['dispatch'], getState: IStore['getState']) {
    if (arePollsDisabled(getState())) {
        return;
    }

    const { pollId, answers, senderId, senderName } = data;

    const receivedAnswer: IIncomingAnswerData = {
        answers: answers.slice(0, MAX_ANSWERS).map(Boolean),
        pollId,
        senderId,
        voterName: getParticipantById(getState(), senderId)
            ? getParticipantDisplayName(getState(), senderId) : senderName
    };

    dispatch(receiveAnswer(receivedAnswer));
}
