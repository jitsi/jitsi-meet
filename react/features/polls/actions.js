// @flow

import {
    CHANGE_VOTE,
    RESET_NB_UNREAD_POLLS,
    RECEIVE_ANSWER,
    RECEIVE_POLL,
    RECEIVE_POLLS,
    SHOW_POLL,
    HIDE_POLL,
    REGISTER_VOTE,
    RETRACT_VOTE
} from './actionTypes';
import type { Answer, Poll } from './types';

/**
 * Action to signal that polls were received.
 *
 * @param {Array<string>} pollIds - The new poll ids.
 * @param {Object} polls - The incoming object containing Poll objects.
 * @param {boolean} notify - Whether to send or not a notification.
 * @returns {{
 *     type: RECEIVE_POLLS,
 *     polls: Polls,
 *     notify: boolean
 * }}
 */
export const receivePolls = (pollIds: Array<string>, polls: Array<Poll>, notify: boolean) => {
    return {
        type: RECEIVE_POLLS,
        pollIds,
        polls,
        notify
    };
};

/*
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
 * @param {Poll} poll - The incoming Poll object.
 * @param {boolean} notify - Whether to send or not a notification.
 * @returns {{
 *     type: RECEIVE_POLL,
 *     poll: Poll,
 *     pollId: string,
 *     notify: boolean
 * }}
 */
export const receivePoll = (pollId: string, poll: Poll, notify: boolean) => {
    return {
        type: RECEIVE_POLL,
        poll,
        pollId,
        notify
    };
};

/**
 * Action to signal that a poll was hidden.
 *
 * @param {string} pollId - The id of the poll.
 * @returns {{
 *     type: HIDE_POLL,
 *     pollId: string
 * }}
 */
export const hidePoll = (pollId: string) => {
    return {
        type: HIDE_POLL,
        pollId
    };
};

/**
 * Action to signal that a poll was shown.
 *
 * @param {string} pollId - The id of the poll.
 * @returns {{
 *     type: SHOW_POLL,
 *     pollId: string
 * }}
 */
export const showPoll = (pollId: string) => {
    return {
        type: SHOW_POLL,
        pollId
    };
};

/**
 * Action to signal that a new answer was received.
 *
 * @param {string} pollId - The id of the incoming poll.
 * @param {Answer} answer - The incoming Answer object.
 * @returns {{
 *     type: RECEIVE_ANSWER,
 *     answer: Answer,
 *     pollId: string
 * }}
 */
export const receiveAnswer = (pollId: string, answer: Answer) => {
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
