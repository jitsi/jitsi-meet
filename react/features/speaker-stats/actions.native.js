// @flow

import { CLOSE_SPEAKER_STATS } from './actionTypes';

export * from './actions.any';


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
