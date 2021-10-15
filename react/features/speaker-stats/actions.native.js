// @flow

import { OPEN_SPEAKER_STATS } from './actionTypes';

export * from './actions.any';


/**
 * Displays the chat panel.
 *
 * @param {Object} conference - The recipient for the private chat.
 *
 * @returns {{
 *     conference: Object,
 *     type: OPEN_SPEAKER_STATS
 * }}
 */
export function openSpeakerStats(conference: Object) {
    return {
        conference,
        type: OPEN_SPEAKER_STATS
    };
}
