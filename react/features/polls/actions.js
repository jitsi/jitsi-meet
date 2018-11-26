// @flow

import {
    POLL_SESSION_INITIATED,
    POLL_SESSION_STARTED
} from './actionTypes';
import { showNotification } from '../notifications/actions';

/**
 * Initiate a poll session.
 *
 * @param {Object} poll - Poll object.
 * @returns {{
 *      type: POLL_SESSION_INITIATED,
 *      question: string,
 *      items: Array<Object>
 * }}
 */
export function initiatePollSession(poll: Object) {
    return {
        type: POLL_SESSION_INITIATED,
        poll
    };
}

/**
 * Start Poll session for participants other than the creator.
 *
 * @param {Object} poll - Poll object.
 * @returns {{
 * }}
 */
export function startPollSession(poll: Object) {
    return {
        type: POLL_SESSION_STARTED,
        poll
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
