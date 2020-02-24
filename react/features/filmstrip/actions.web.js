// @flow

import { SET_HORIZONTAL_VIEW_DIMENSIONS, SET_TILE_VIEW_DIMENSIONS } from './actionTypes';
import { calculateThumbnailSizeForHorizontalView, calculateThumbnailSizeForTileView } from './functions';

/**
 * The size of the side margins for each tile as set in CSS.
 */
const TILE_VIEW_SIDE_MARGINS = 10 * 2;

/**
 * Sets the dimensions of the tile view grid.
 *
 * @param {Object} dimensions - Whether the filmstrip is visible.
 * @param {Object} windowSize - The size of the window.
 * @returns {{
 *     type: SET_TILE_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }}
 */
export function setTileViewDimensions(dimensions: Object, windowSize: Object) {
    const thumbnailSize = calculateThumbnailSizeForTileView({
        ...dimensions,
        ...windowSize
    });
    const filmstripWidth = dimensions.columns * (TILE_VIEW_SIDE_MARGINS + thumbnailSize.width);

    return {
        type: SET_TILE_VIEW_DIMENSIONS,
        dimensions: {
            gridDimensions: dimensions,
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
