import {
    MODERATOR,
    MODERATOR_BROWSER,
    PARTICIPANT1_BROWSER,
    PARTICIPANT2_BROWSER,
    FIRST_PARTICIPANT,
    SECOND_PARTICIPANT
} from './constants';
import createSession from './createSession';

/**
 * Function that creates a browser session.
 *
 * @returns {void}
 */
export default function createBrowserSession(participant) {
    switch (participant) {
    case FIRST_PARTICIPANT:
        return createSession(PARTICIPANT1_BROWSER);
    case SECOND_PARTICIPANT:
        return createSession(PARTICIPANT2_BROWSER);
    case MODERATOR:
        return createSession(MODERATOR_BROWSER);
    default:
        return;
    }
}
