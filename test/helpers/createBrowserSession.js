import {
    PARTICIPANT1_BROWSER,
    PARTICIPANT2_BROWSER,
    PARTICIPANT3_BROWSER,
    FIRST_PARTICIPANT,
    SECOND_PARTICIPANT,
    THIRD_PARTICIPANT
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
    case THIRD_PARTICIPANT:
        return createSession(PARTICIPANT3_BROWSER);
    default:
        return;
    }
}
