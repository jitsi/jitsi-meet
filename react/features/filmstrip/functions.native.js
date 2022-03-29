// @flow

import { getFeatureFlag, FILMSTRIP_ENABLED } from '../base/flags';
import { getParticipantCountWithFake, getPinnedParticipant } from '../base/participants';
import { toState } from '../base/redux';
import { ASPECT_RATIO_NARROW } from '../base/responsive-ui/constants';

export * from './functions.any';

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

/**
 * Returns how many columns should be displayed for tile view.
 *
 * @param {Object | Function} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {number} - The number of columns to be rendered in tile view.
 * @private
 */
export function getColumnCount(stateful: Object | Function) {
    const state = toState(stateful);
    const participantCount = getParticipantCountWithFake(state);
    const { aspectRatio } = state['features/base/responsive-ui'];

    // For narrow view, tiles should stack on top of each other for a lonely
    // call and a 1:1 call. Otherwise tiles should be grouped into rows of
    // two.
    if (aspectRatio === ASPECT_RATIO_NARROW) {
        return participantCount >= 3 ? 2 : 1;
    }

    if (participantCount === 4) {
        // In wide view, a four person call should display as a 2x2 grid.
        return 2;
    }

    return Math.min(3, participantCount);
}

/**
 * Returns true if thumbnail reordering is enabled and false otherwise.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} - True if thumbnail reordering is enabled and false otherwise.
 */
export function isReorderingEnabled(state) {
    const { testing = {} } = state['features/base/config'];
    const enableThumbnailReordering = testing.enableThumbnailReordering ?? true;

    return enableThumbnailReordering;
}

/**
 * Whether the stage filmstrip is disabled or not.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function isStageFilmstripEnabled() {
    return false;
}
