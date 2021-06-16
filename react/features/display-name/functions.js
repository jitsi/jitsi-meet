// @flow

import { getCurrentLayout, LAYOUTS } from '../video-layout';

/**
 * Appends a suffix to the display name.
 *
 * @param {string} displayName - The display name.
 * @param {string} suffix - Suffix that will be appended.
 * @returns {string} The formatted display name.
 */
export function appendSuffix(displayName: string, suffix: string = '') {
    return `${displayName || suffix}${
        displayName && suffix && displayName !== suffix ? ` (${suffix})` : ''}`;
}

/**
 * Selector for whether we are currently in tile view.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isLayoutTileView(state: Object) {
    return getCurrentLayout(state) === LAYOUTS.TILE_VIEW;
}
