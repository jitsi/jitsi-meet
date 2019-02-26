// @flow

import { showNotification } from '../notifications/actions';
import {
    END_POLL,
    POLL_ENDED,
    POLL_STARTED,
    POLL_VOTED,
    START_POLL,
    VOTE_POLL
} from './actionTypes';

/**
 * Called by local user to end current poll.
 *
 * @returns {{
 *     type: END_POLL
 * }}
 */
export function endPoll() {
    return {
        type: END_POLL
    };
}

/**
 * Update Redux state to end current poll.
 *
 * @returns {{
 *     type: POLL_ENDED
 * }}
 */
export function endedPoll() {
    return {
        type: POLL_ENDED
    };
}

/**
 * Show UI notification about the end of the poll session.
 *
 * @returns {{}}
 */
export function showPollEndNotification() {
    return showNotification({
        titleKey: 'polls.endNotificationTitle',
        descriptionKey: 'polls.endNotificationBody'
    });
}

/**
 * Show UI notification about the start of the poll session.
 *
 * @returns {{}}
 */
export function showPollStartNotification() {
    return showNotification({
        titleKey: 'polls.startNotificationTitle',
        descriptionKey: 'polls.startNotificationBody'
    });
}

/**
 * Called by local user to initiate a poll
 * in the conference room.
 *
 * @param {{
 *     poll: Object,
 *     choices: Object,
 *     question: Object
 * }} payload - Expectes three objects that represent the poll.
 * @returns {{
 *     type: START_POLL,
 *     poll: Object,
 *     question: Object,
 *     choices: Object
 * }}
 */
export function startPoll(payload: Object) {
    return {
        type: START_POLL,
        ...payload
    };
}

/**
 * Adds a new poll to the Redux state.
 *
 * @param {{
 *     poll: Object,
 *     choices: Object,
 *     question: Object
 * }} payload - Expectes three objects that represent the poll.
 * @returns {{
 *     type: POLL_STARTED,
 *     poll: Object,
 *     question: Object,
 *     choices: Object
 * }}
 */
export function startedPoll(payload: Object) {
    return {
        type: POLL_STARTED,
        ...payload
    };
}

/**
 * Called by local user to toggle their vote.
 *
 * @param {string} choiceID - Option voted for identified by text.
 * @returns {{
 *     type: VOTE_POLL,
 *     choiceID: string
 * }}
 */
export function vote(choiceID: string) {
    return {
        type: VOTE_POLL,
        choiceID
    };
}

/**
 * Update Redux state about a user's vote.
 *
 * @param {Object} choice - Option voted for.
 * @returns {{
 *     type: POLL_VOTED,
 *     choice: Object
 * }}
 */
export function voted(choice: Object) {
    return {
        type: POLL_VOTED,
        choice
    };
}
