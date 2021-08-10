// @flow

import { getFeatureFlag, FILMSTRIP_ENABLED } from '../base/flags';
import { getParticipantCountWithFake, getPinnedParticipant } from '../base/participants';
import { toState } from '../base/redux';

/**
 * Returns true if the filmstrip on mobile is visible, false otherwise.
 *
 * NOTE: Filmstrip on mobile behaves differently to web, and is only visible
 * when there are at least 2 participants.
 *
 * @param {Object | Function} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {boolean}
 */
export function isFilmstripVisible(stateful: Object | Function) {
    const state = toState(stateful);

    const enabled = getFeatureFlag(state, FILMSTRIP_ENABLED, true);

    if (!enabled) {
        return false;
    }

    return getParticipantCountWithFake(state) > 1;
}

/**
 * Determines whether the remote video thumbnails should be displayed/visible in
 * the filmstrip.
 *
 * @param {Object} state - The full redux state.
 * @returns {boolean} - If remote video thumbnails should be displayed/visible
 * in the filmstrip, then {@code true}; otherwise, {@code false}.
 */
export function shouldRemoteVideosBeVisible(state: Object) {
    if (state['features/invite'].calleeInfoVisible) {
        return false;
    }

    // Include fake participants to derive how many thumbnails are dispalyed,
    // as it is assumed all participants, including fake, will be displayed
    // in the filmstrip.
    const participantCount = getParticipantCountWithFake(state);
    const pinnedParticipant = getPinnedParticipant(state);
    const { disable1On1Mode } = state['features/base/config'];

    return Boolean(
        participantCount > 2

            // Always show the filmstrip when there is another participant to
            // show and the local video is pinned. Note we are not taking the
            // toolbar visibility into account here (unlike web) because
            // showing / hiding views in quick succession on mobile is taxing.
            || (participantCount > 1 && pinnedParticipant?.local)

            || disable1On1Mode);
}
