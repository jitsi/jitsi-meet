// @flow

import {
    END_POLL,
    START_POLL,
    VOTE_POLL,
    POLL_SESSION_STARTED,
    POLL_SESSION_VOTE,
    POLL_SESSION_FINISHED
} from './actionTypes';
import { showNotification } from '../notifications/actions';

/**
 * Initiate a poll session.
 *
 * @param {Object} payload - Poll object.
 * @returns {{
 *      type: POLL_SESSION_INITIATED,
 *      question: string,
 *      items: Array<Object>
 * }}
 */
export function startPoll(payload: Object) {
    return {
        type: START_POLL,
        ...payload
    };
}

/**
 * Start Poll session for participants other than the creator.
 *
 * @param {Object} payload - Poll object.
 * @returns {{
 * }}
 */
export function addPoll(payload: Object) {
    return {
        type: POLL_SESSION_STARTED,
        ...payload
    };
}

/**
 * Show UI notification about the start of the poll session.
 *
 * @returns {{}}
 */
export function showPollStartNotification() {
    // FIXME: update text.
    const props = {
        title: 'Poll Started!',
        description: 'A Poll has been created'
    };

    return showNotification({
        isDismissAllowed: true,
        ...props
    });
}

/**
 * Show UI notification about the end of the poll session.
 *
 * @returns {{}}
 */
export function showPollEndNotification() {
    // FIXME: update text.
    const props = {
        title: 'Poll Finished!',
        description: 'Current Poll has been ended'
    };

    return showNotification({
        isDismissAllowed: true,
        ...props
    });
}

/**
 * Vote for an option.
 *
 * @param {string} choiceID - Option voted for identified by text.
 * @returns {{
 *      type: POLL_SESSION_VOTE,
 *      item: string,
 *      user: string
 * }}
 */
export function vote(choiceID: string) {
    return {
        type: VOTE_POLL,
        choiceID
    };
}

/**
 * Update state about other participant vote.
 *
 * @param {Object} choice - Option voted for.
 * @returns {{}}
 */
export function updateVote(choice: Object) {
    return {
        type: POLL_SESSION_VOTE,
        choice
    };
}


/**
 * Local user action to end the poll.
 *
 * @returns {{}}
 */
export function endPoll() {
    return {
        type: END_POLL
    };
}

/**
 * Recieved command to end the poll.
 *
 * @returns {{}}
 */
export function finishPoll() {
    return {
        type: POLL_SESSION_FINISHED
    };
}
