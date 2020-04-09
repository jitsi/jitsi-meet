// @flow

import { LAYOUTS } from './constants';
import { getPinnedParticipant } from '../base/participants';

declare var interfaceConfig: Object;

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

    return Math.min(Math.max(configuredMax, 1), 5);
}

/**
 * Returns the cell count dimensions for tile view. Tile view tries to fill
 * the available space optimally.
 *
 * @param {Object} state - The redux store state.
 * @returns {Object} An object is return with the desired number of columns,
 * rows, and visible rows (the rest should overflow) for the tile view layout.
 */
export function getTileViewGridDimensions(state: Object) {
    // When in tile view mode, we must discount ourselves (the local participant) because our
    // tile is not visible.
    const { iAmRecorder } = state['features/base/config'];
    const numberOfParticipants = state['features/base/participants'].length - (iAmRecorder ? 1 : 0);
    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const aspectRatio = state['features/filmstrip'].TILE_ASPECT_RATIO;

    let bestColumns = 0;
    let bestRows = 0;
    let bestTileWidth = 0;
    let bestFound = false;

    while (!bestFound) {
        const columns = bestColumns + 1;
        const straightTileWidth = Math.floor(clientWidth / columns);

        const rows = Math.ceil(numberOfParticipants / columns);
        const straightTileHeight = Math.floor(clientHeight / rows);

        const constrainedTileWidth = Math.ceil(straightTileHeight * aspectRatio);

        const tileWidth = Math.min(straightTileWidth, constrainedTileWidth);

        if (tileWidth > bestTileWidth) {
            bestColumns = columns;
            bestRows = rows;
            bestTileWidth = tileWidth;
        } else {
            bestFound = true;
        }
    }

    return {
        columns: bestColumns,
        visibleRows: bestRows
    };
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
            && (!state['features/etherpad']
                || !state['features/etherpad'].editing)

            // Truthy check is needed for interfaceConfig to prevent errors on
            // mobile which does not have interfaceConfig. On web, tile view
            // should never be enabled for filmstrip only mode.
            && (typeof interfaceConfig === 'undefined'
                || !interfaceConfig.filmStripOnly)
            && !getPinnedParticipant(state)
    );
}
