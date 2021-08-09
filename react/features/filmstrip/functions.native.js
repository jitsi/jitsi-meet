// @flow

import { getFeatureFlag, FILMSTRIP_ENABLED } from '../base/flags';
import { getParticipantCountWithFake } from '../base/participants';
import { toState } from '../base/redux';
import { ASPECT_RATIO_NARROW } from '../base/responsive-ui/constants';

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
