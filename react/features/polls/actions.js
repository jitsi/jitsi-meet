// @flow

import {
    POLL_SESSION_INITIATED,
    POLL_SESSION_STARTED,
    POLL_SESSION_VOTE,
    POLL_SESSION_VOTE_RECIEVED,
    POLL_SESSION_END,
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
export function initiatePollSession(payload: Object) {
    return {
        type: POLL_SESSION_INITIATED,
        payload
    };
}

/**
 * Start Poll session for participants other than the creator.
 *
 * @param {Object} payload - Poll object.
 * @returns {{
 * }}
 */
export function startPollSession(payload: Object) {
    return {
        type: POLL_SESSION_STARTED,
        payload
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
* @param {string} prevID - Previously voted option or null if first vote.
 * @param {string} id - Option voted for identified by text.
 * @param {string} user - User ID who voted.
 * @returns {{
 *      type: POLL_SESSION_VOTE,
 *      item: string,
 *      user: string
 * }}
 */
export function vote(prevID: ?string, id: string, user: string) {
    return {
        type: POLL_SESSION_VOTE,
        prevID,
        id,
        user
    };
}

/**
 * Update state about other participant vote.
 *
 * @param {string} prevID - Previously voted option or null if first vote.
 * @param {string} id - Option voted for identified by text.
 * @param {string} user - User ID who voted.
 * @returns {{}}
 */
export function updateVotes(prevID: string | null,
        id: string, user: string) {
    return {
        type: POLL_SESSION_VOTE_RECIEVED,
        prevID,
        id,
        user
    };
}


/**
 * End poll session action.
 *
 * @returns {{}}
 */
export function endPollSession() {
    return {
        type: POLL_SESSION_END
    };
}

/**
 * End poll session action.
 *
 * @returns {{}}
 */
export function pollSessionFinished() {
    return {
        type: POLL_SESSION_FINISHED
    };
}
