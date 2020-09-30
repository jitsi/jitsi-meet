// @flow

import { CHAT_SIZE } from '../chat/constants';
import { getMaxColumnCount, getMaxRowCount } from '../video-layout';

import { SET_HORIZONTAL_VIEW_DIMENSIONS, SET_TILE_VIEW_DIMENSIONS } from './actionTypes';
import { calculateThumbnailSizeForHorizontalView, calculateThumbnailSizeForTileView } from './functions';

/**
 * The size of the side margins for each tile as set in CSS.
 */
const TILE_VIEW_SIDE_MARGINS = 10 * 2;

/**
 * Sets the dimensions of the tile view grid.  Tries layouts for each
 * number of columns ranging from 1 to the maximum (up to 5), preferring
 * layouts that show more tiles, and subject to this, preferring layouts
 * with larger tiles, optimizing the available space.
 *
 * Should be called whenever the number of participants or the available
 * space (including window size and whether the chat sidebar is displayed)
 * changes.
 *
 * @param {Object} state - The Redux state object.
 * @returns {{
 *     type: SET_TILE_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }}
 */
export function setTileViewDimensions(state: Object) {
    // Compute available window size, discounting chat sidebar.
    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const { isOpen } = state['features/chat'];
    let widthToUse = clientWidth;

    if (isOpen) {
        widthToUse -= CHAT_SIZE;
    }

    // When in tile view mode, we must discount ourselves (the local participant) because our
    // tile is not visible.
    const { iAmRecorder } = state['features/base/config'];
    const numberOfParticipants = state['features/base/participants'].length - (iAmRecorder ? 1 : 0);

    const maxColumns = getMaxColumnCount();
    const maxRows = getMaxRowCount();

    // Current best layout
    let columns = 0, visibleRows = 0;
    let thumbnailSize = {
        width: 0,
        height: 0
    };

    // Try each possible number of columns, and maintain best layout.
    for (let tryColumns = 1; tryColumns <= maxColumns; tryColumns++) {
        const tryRows = Math.ceil(numberOfParticipants / tryColumns);
        const tryVisibleRows = Math.min(maxRows, tryRows);
        const tryThumbnailSize = calculateThumbnailSizeForTileView({
            columns: tryColumns,
            visibleRows: tryVisibleRows,
            clientWidth: widthToUse,
            clientHeight
        });

        // Prefer layouts showing more participants/tiles. Because we
        // try layouts in increasing order by columns, and rows is
        // limited by a maximum, this preference will take priority.
        // Then prefer layouts with larger tile size (width).
        if ((visibleRows * columns < numberOfParticipants
             && visibleRows * columns < tryVisibleRows * tryColumns)
            || thumbnailSize.width < tryThumbnailSize.width) {
            thumbnailSize = tryThumbnailSize;
            columns = tryColumns;
            visibleRows = tryVisibleRows;
        }
    }

    const filmstripWidth = columns * (TILE_VIEW_SIDE_MARGINS + thumbnailSize.width);

    return {
        type: SET_TILE_VIEW_DIMENSIONS,
        dimensions: {
            gridDimensions: {
                columns,
                visibleRows
            },
            thumbnailSize,
            filmstripWidth
        }
    };
}

/**
 * Sets the dimensions of the thumbnails in horizontal view.
 *
 * @param {number} clientHeight - The height of the window.
 * @returns {{
 *     type: SET_HORIZONTAL_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }}
 */
export function setHorizontalViewDimensions(clientHeight: number = 0) {
    return {
        type: SET_HORIZONTAL_VIEW_DIMENSIONS,
        dimensions: calculateThumbnailSizeForHorizontalView(clientHeight)
    };
}

export * from './actions.native';
