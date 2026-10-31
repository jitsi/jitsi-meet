import { createPollEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { showErrorNotification } from '../notifications/actions';

import {
    CHANGE_VOTE,
    CLEAR_POLLS,
    EDIT_POLL,
    RECEIVE_ANSWER,
    RECEIVE_POLL,
    RECEIVE_POLL_CLOSED,
    REGISTER_VOTE,
    REMOVE_POLL,
    RESET_UNREAD_POLLS_COUNT,
    SAVE_POLL
} from './actionTypes';
import { IAnswerData, IIncomingAnswerData, IPoll, IPollData } from './types';

/**
 * Action to signal that existing polls needs to be cleared from state.
 *
 * @returns {{
 *     type: CLEAR_POLLS
 * }}
 */
export const clearPolls = () => {
    return {
        type: CLEAR_POLLS
    };
};

/**
 * Action to signal that a poll's vote will be changed.
 *
 * @param {string} pollId - The id of the incoming poll.
 * @param {boolean} value - The value of the 'changing' state.

 * @returns {{
 *     type: CHANGE_VOTE,
 *     pollId: string,
 *     value: boolean
 * }}
 */
export const setVoteChanging = (pollId: string, value: boolean) => {
    return {
        type: CHANGE_VOTE,
        pollId,
        value
    };
};

/**
 * Action to signal that a new poll was received.
 *
 * @param {IPoll} poll - The incoming Poll object.
 * @param {boolean} notify - Whether to send or not a notification.
 * @returns {{
 *     type: RECEIVE_POLL,
 *     pollId: string,
 *     poll: IPoll,
 *     notify: boolean
 * }}
 */
export const receivePoll = (poll: IPoll, notify: boolean) => {
    return {
        type: RECEIVE_POLL,
        poll,
        notify
    };
};

/**
 * Action to signal that a new answer was received.
 *
 * @param {IIncomingAnswerData} answer - The incoming Answer object.
 * @returns {{
 *     type: RECEIVE_ANSWER,
 *     answer: IIncomingAnswerData
 * }}
 */
export const receiveAnswer = (answer: IIncomingAnswerData) => {
    return {
        type: RECEIVE_ANSWER,
        answer
    };
};

/**
 * Action to register a vote on a poll.
 *
 * @param {string} pollId - The id of the poll.
 * @param {?Array<boolean>} answers - The new answers.
 * @returns {{
 *     type: REGISTER_VOTE,
 *     pollId: string,
 *     answers: ?Array<boolean>
 * }}
 */
export const registerVote = (pollId: string, answers: Array<boolean> | null) => {
    return {
        type: REGISTER_VOTE,
        pollId,
        answers
    };
};

/**
 * Closes a poll, thus it does not take answers anymore. The server accepts it from the creator of the poll and from a
 * moderator.
 *
 * @param {string} pollId - The id of the poll.
 * @returns {Function}
 */
export const closePoll = (pollId: string) => (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
    // Rejected when the server refuses the close. A lib-jitsi-meet without that error returns nothing.
    getState()['features/base/conference'].conference?.getPolls()?.closePoll(pollId)
        ?.catch(() => dispatch(showErrorNotification({ titleKey: 'polls.errors.closeFailed' })));
    sendAnalytics(createPollEvent('closed'));
};

/**
 * Action to signal that a poll was closed, thus it does not take answers anymore.
 *
 * @param {string} pollId - The id of the poll.
 * @param {Array<IAnswerData>} [answers] - The answers of the poll as the server has them when it was closed.
 * @returns {{
 *     type: RECEIVE_POLL_CLOSED,
 *     answers: Array<IAnswerData>,
 *     pollId: string
 * }}
 */
export const receivePollClosed = (pollId: string, answers?: Array<IAnswerData>) => {
    return {
        type: RECEIVE_POLL_CLOSED,
        answers,
        pollId
    };
};

/**
 * Action to signal the number reset of unread polls.
 *
 * @returns {{
 *     type: RESET_UNREAD_POLLS_COUNT
 * }}
 */
export function resetUnreadPollsCount() {
    return {
        type: RESET_UNREAD_POLLS_COUNT
    };
}

/**
 * Action to signal saving a poll.
 *
 * @param {IPollData} poll - The Poll object that gets to be saved.
 * @returns {{
 *     type: SAVE_POLL,
 *     poll: IPollData
 * }}
 */
export function savePoll(poll: IPollData) {
    return {
        type: SAVE_POLL,
        poll
    };
}

/**
 * Action to signal editing a poll.
 *
 * @param {string} pollId - The id of the poll that gets to be edited.
 * @param {boolean} editing - Whether the poll is in edit mode or not.
 * @returns {{
 *     type: EDIT_POLL,
 *     pollId: string,
 *     editing: boolean
 * }}
 */
export function editPoll(pollId: string, editing: boolean) {
    return {
        type: EDIT_POLL,
        pollId,
        editing
    };
}

/**
 * Action to signal that existing polls needs to be removed.
 *
 * @param {IPoll} poll - The incoming Poll object.
 * @returns {{
 *     type: REMOVE_POLL,
 *     poll: IPoll
 * }}
 */
export const removePoll = (poll: IPoll) => {
    return {
        type: REMOVE_POLL,
        poll
    };
};
