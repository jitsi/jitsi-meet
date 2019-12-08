// @flow

import {
    getParticipantCountWithFake,
    getPinnedParticipant
} from '../base/participants';
import { toState } from '../base/redux';

declare var interfaceConfig: Object;

/**
 * Returns true if the filmstrip on mobile is visible, false otherwise.
 *
 * NOTE: Filmstrip on web behaves differently to mobile, much simpler, but so
 * function lies here only for the sake of consistency and to avoid flow errors
 * on import.
 *
 * @param {Object | Function} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {boolean}
 */
export function isFilmstripVisible(stateful: Object | Function) {
    return toState(stateful)['features/filmstrip'].visible;
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
    let pinnedParticipant;

    return Boolean(
        participantCount > 2

            // Always show the filmstrip when there is another participant to
            // show and the filmstrip is hovered, or local video is pinned, or
            // the toolbar is displayed.
            || (participantCount > 1
                && (state['features/filmstrip'].hovered
                    || state['features/toolbox'].visible
                    || ((pinnedParticipant = getPinnedParticipant(state))
                        && pinnedParticipant.local)))

            || (typeof interfaceConfig === 'object'
                && interfaceConfig.filmStripOnly)

            || state['features/base/config'].disable1On1Mode);
}
