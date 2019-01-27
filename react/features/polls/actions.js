// @flow

import { showNotification } from '../notifications/actions';
import {
    END_POLL,
    START_POLL,
    VOTE_POLL,
    POLL_SESSION_STARTED,
    POLL_SESSION_VOTE,
    POLL_SESSION_FINISHED
} from './actionTypes';

/**
 * Adds a new poll to the Redux state.
 *
 * @param {{
 *     poll: Object,
 *     choices: Object,
 *     question: Object
 * }} payload - Expectes three objects that represent the poll.
 * @returns {{
 *     type: POLL_SESSION_STARTED,
 *     poll: Object,
 *     question: Object,
 *     choices: Object
 * }}
 */
export function addPoll(payload: Object) {
    return {
        type: POLL_SESSION_STARTED,
        ...payload
    };
}

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
 *     type: POLL_SESSION_FINISHED
 * }}
 */
export function finishPoll() {
    return {
        type: POLL_SESSION_FINISHED
    };
}

/**
 * Show UI notification about the end of the poll session.
 *
 * @returns {{}}
 */
export function showPollEndNotification() {
    const props = {
        titleKey: 'polls.endNotificationTitle',
        descriptionKey: 'polls.endNotificationBody'
    };

    return showNotification({
        isDismissAllowed: true,
        ...props
    });
}

/**
 * Show UI notification about the start of the poll session.
 *
 * @returns {{}}
 */
export function showPollStartNotification() {
    const props = {
        titleKey: 'polls.startNotificationTitle',
        descriptionKey: 'polls.startNotificationBody'
    };

    return showNotification({
        ...props
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
 * Update Redux state about a user's vote.
 *
 * @param {Object} choice - Option voted for.
 * @returns {{
 *     type: POLL_SESSION_VOTE,
 *     choice: Object
 * }}
 */
export function updateVote(choice: Object) {
    return {
        type: POLL_SESSION_VOTE,
        choice
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
