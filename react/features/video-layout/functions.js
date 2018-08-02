// @flow

import { LAYOUTS } from './constants';

declare var interfaceConfig: Object;

/**
 * Returns how many tile columns should be displayed for tile view.
 *
 * @param {Object} state - The redux state.
 * @param {number} maxColumns - The maximum number of columns that can be
 * displayed.
 * @returns {number}
 */
export function calculateColumnCount(state: Object, maxColumns: number) {
    // Purposefully include all participants, which includes fake participants
    // that should show a thumbnail.
    const potentialThumbnails = state['features/base/participants'].length;
    const columnsToMaintainASquare = Math.ceil(Math.sqrt(potentialThumbnails));

    return Math.min(
        columnsToMaintainASquare,
        maxColumns
    );
}

/**
 * Returns how many total rows will be in the tile view grid.
 *
 * @param {Object} state - The redux state.
 * @param {number} columns - The number of columns that will be displayed.
 * @returns {number}
 */
export function calculateRowCount(state: Object, columns: number) {
    const potentialThumbnails = state['features/base/participants'].length;

    return Math.ceil(potentialThumbnails / columns);
}

/**
 * Returns the {@code LAYOUTS} constant associated with the layout
 * the application should currently be in.
 *
 * @param {Object} state - The redux state.
 * @returns {string}
 */
export function getCurrentLayout(state: Object) {
    if (shouldDisplayTileView(state)) {
        return LAYOUTS.TILE_VIEW;
    } else if (interfaceConfig.VERTICAL_FILMSTRIP) {
        return LAYOUTS.VERTICAL_FILMSTRIP_VIEW;
    }

    return LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW;
}

/**
 * Returns how many columns should be displayed in tile view. The number
 * returned will be between 1 and 5, inclusive.
 *
 * @returns {number}
 */
export function getMaxColumnCount() {
    const configuredMax = interfaceConfig.TILE_VIEW_MAX_COLUMNS || 5;

    return Math.max(Math.min(configuredMax, 1), 5);
}

/**
 * Selector for determining if the UI layout should be in tile view. Tile view
 * is determined by more than just having the tile view setting enabled, as
 * one-on-one calls should not be in tile view, as well as etherpad editing.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} True if tile view should be displayed.
 */
export function shouldDisplayTileView(state: Object = {}) {
    return Boolean(
        state['features/video-layout']
            && state['features/video-layout'].tileViewEnabled
            && !state['features/etherpad'].editing
    );
}
