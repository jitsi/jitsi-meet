import {
    CHANGE_VOTE,
    CLEAR_POLLS,
    RECEIVE_ANSWER,
    RECEIVE_POLL,
    REGISTER_VOTE,
    RESET_NB_UNREAD_POLLS,
    RETRACT_VOTE
} from './actionTypes';
import { IAnswer, IPoll } from './types';

/**
 * Action to signal that existing polls needs to be cleared from state.
 *
 * @returns {{
 *     type: CLEAR_POLLS
 * }}
 */
export const clearPolls = () => {
    return { type: CLEAR_POLLS };
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
 * @param {string} pollId - The id of the incoming poll.
 * @param {IPoll} poll - The incoming Poll object.
 * @param {boolean} notify - Whether to send or not a notification.
 * @returns {{
 *     type: RECEIVE_POLL,
 *     poll: IPoll,
 *     pollId: string,
 *     notify: boolean
 * }}
 */
export const receivePoll = (pollId: string, poll: IPoll, notify: boolean) => {
    return {
        type: RECEIVE_POLL,
        poll,
        pollId,
        notify
    };
};

/**
 * Action to signal that a new answer was received.
 *
 * @param {string} pollId - The id of the incoming poll.
 * @param {IAnswer} answer - The incoming Answer object.
 * @returns {{
 *     type: RECEIVE_ANSWER,
 *     answer: IAnswer,
 *     pollId: string
 * }}
 */
export const receiveAnswer = (pollId: string, answer: IAnswer) => {
    return {
        type: RECEIVE_ANSWER,
        answer,
        pollId
    };
};

/**
 * Action to register a vote on a poll.
 *
 * @param {string} pollId - The id of the poll.
 * @param {?Array<boolean>} answers - The new answers.
 * @returns {{
 *     type: REGISTER_VOTE,
 *     answers: ?Array<boolean>,
 *     pollId: string
 * }}
 */
export const registerVote = (pollId: string, answers: Array<boolean> | null) => {
    return {
        type: REGISTER_VOTE,
        answers,
        pollId
    };
};

/**
 * Action to retract a vote on a poll.
 *
 * @param {string} pollId - The id of the poll.
 * @returns {{
 *     type: RETRACT_VOTE,
 *     pollId: string
 * }}
 */
export const retractVote = (pollId: string) => {
    return {
        type: RETRACT_VOTE,
        pollId
    };
};

/**
 * Action to signal the closing of the polls tab.
 *
 * @returns {{
 *     type: POLL_TAB_CLOSED
 * }}
 */
export function resetNbUnreadPollsMessages() {
    return {
        type: RESET_NB_UNREAD_POLLS
    };
}
