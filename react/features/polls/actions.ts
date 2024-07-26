import {
    CHANGE_VOTE,
    CLEAR_POLLS,
    EDIT_POLL,
    RECEIVE_ANSWER,
    RECEIVE_POLL,
    REGISTER_VOTE,
    REMOVE_POLL,
    RESET_NB_UNREAD_POLLS,
    SAVE_POLL
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
 * @param {string} pollId - The id of the incoming poll.
 * @param {IPoll} poll - The incoming Poll object.
 * @param {boolean} notify - Whether to send or not a notification.
 * @returns {{
 *     type: RECEIVE_POLL,
 *     pollId: string,
 *     poll: IPoll,
 *     notify: boolean
 * }}
 */
export const receivePoll = (pollId: string, poll: IPoll, notify: boolean) => {
    return {
        type: RECEIVE_POLL,
        pollId,
        poll,
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
 *     pollId: string,
 *     answer: IAnswer
 * }}
 */
export const receiveAnswer = (pollId: string, answer: IAnswer) => {
    return {
        type: RECEIVE_ANSWER,
        pollId,
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
 * Action to signal the number reset of unread polls.
 *
 * @returns {{
 *     type: RESET_NB_UNREAD_POLLS
 * }}
 */
export function resetNbUnreadPollsMessages() {
    return {
        type: RESET_NB_UNREAD_POLLS
    };
}

/**
 * Action to signal saving a poll.
 *
 * @param {string} pollId - The id of the poll that gets to be saved.
 * @param {IPoll} poll - The Poll object that gets to be saved.
 * @returns {{
 *     type: SAVE_POLL,
 *     meetingId: string,
 *     pollId: string,
 *     poll: IPoll
 * }}
 */
export function savePoll(pollId: string, poll: IPoll) {
    return {
        type: SAVE_POLL,
        pollId,
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
 * @param {string} pollId - The id of the poll that gets to be removed.
 * @param {IPoll} poll - The incoming Poll object.
 * @returns {{
 *     type: REMOVE_POLL,
 *     pollId: string,
 *     poll: IPoll
 * }}
 */
export const removePoll = (pollId: string, poll: IPoll) => {
    return {
        type: REMOVE_POLL,
        pollId,
        poll
    };
};
