import { IPoll } from '../polls/types';

import { REMOVE_POLL_FROM_HISTORY, SAVE_POLL_IN_HISTORY } from './actionTypes';

/**
 * Action to signal saving a poll in history(local storage).
 *
 * @param {string} meetingId - The id of the meeting in which polls get to be saved.
 * @param {string} pollId - The id of the poll that gets to be saved.
 * @param {IPoll} poll - The Poll object that gets to be saved.
 * @returns {{
 *     type: SAVE_POLL_IN_HISTORY,
 *     meetingId: string,
 *     pollId: string,
 *     poll: IPoll
 * }}
 */
export function savePollInHistory(meetingId: string | undefined, pollId: string, poll: IPoll) {
    return {
        type: SAVE_POLL_IN_HISTORY,
        meetingId,
        pollId,
        poll
    };
}

/**
 * Action to signal that existing poll needs to be deleted from history(local storage).
 *
 * @param {string} meetingId - The id of the meeting in which poll gets to be removed.
 * @param {string} pollId - The id of the poll that gets to be removed.
 * @param {IPoll} poll - The incoming IPoll object.
 * @returns {{
 *     type: REMOVE_POLL_FROM_HISTORY,
 *     meetingId: string,
 *     pollId: string,
 *     poll: IPoll
 * }}
 */
export const removePollFromHistory = (meetingId: string | undefined, pollId: string, poll: IPoll) => {
    return {
        type: REMOVE_POLL_FROM_HISTORY,
        meetingId,
        pollId,
        poll
    };
};
