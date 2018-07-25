// @flow

import { getParticipantCount } from '../base/participants';

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
 * Returns how many tile columns should be visible on the screen. It is assumed
 * non-visible rows will be viewed by scrolling.
 *
 * @param {Object} state - The redux state.
 * @param {number} maxColumns - The maximum number of columns that can be
 * displayed.
 * @returns {number}
 */
export function calculateVisibleRowCount(state: Object, maxColumns: number) {
    const columns = calculateColumnCount(state, maxColumns);
    const potentialThumbnails = state['features/base/participants'].length;
    const totalRowCount = Math.ceil(potentialThumbnails / columns);

    return Math.min(
        maxColumns,
        totalRowCount
    );

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
 * Selector for determining if the UI layout should be in tile view. Tile view
 * is determined by more than just having the tile view setting enabled, as
 * one-on-one calls should not be in tile view, as well as etherpad editing.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} True if tile view should be displayed.
 */
export function shouldDisplayTileView(state: Object) {
    return Boolean(
        state['features/video-layout'].tileViewEnabled
            && getParticipantCount(state) > 2
            && !state['features/etherpad'].editing
    );
}
