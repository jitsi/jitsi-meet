// @flow

import { CLOSE_SPEAKER_STATS, OPEN_SPEAKER_STATS } from './actionTypes';

export * from './actions.any';


/**
 * Displays the speaker stats panel.
 *
 * @param {Object} conference - The current conference.
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

/**
 * Action to signal the closing of the speaker stats modal dialog.
 *
 * @returns {{
 *     type: CLOSE_SPEAKER_STATS
 * }}
 */
export function closeSpeakerStats() {
    return {
        type: CLOSE_SPEAKER_STATS
    };
}
