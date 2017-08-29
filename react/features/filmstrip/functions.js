declare var interfaceConfig: Object;

import {
    getPinnedParticipant,
    getLocalParticipant
} from '../base/participants';

/**
 * A selector for determining whether or not remote video thumbnails should be
 * displayed in the filmstrip.
 *
 * @param {Object} state - The full redux state.
 * @returns {boolean} - True if remote video thumbnails should be displayed.
 */
export function shouldRemoteVideosBeVisible(state) {
    const participants = state['features/base/participants'];

    const shouldShowVideos
        = state['features/base/config'].disable1On1Mode

        || interfaceConfig.filmStripOnly

        // This is not a 1-on-1 call.
        || participants.length > 2

        // There is another participant and the local participant is pinned.
        || (participants.length > 1
            && getLocalParticipant(state) === getPinnedParticipant(state))

        // There is any non-person participant, like a shared video.
        || participants.find(participant => participant.isBot);

    return Boolean(shouldShowVideos);
}
