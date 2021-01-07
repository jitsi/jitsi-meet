// @flow

import { CHAT_SIZE } from '../chat/constants';

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
 * @param {boolean} isChatOpen - Whether the chat panel is displayed, in
 * order to properly compute the tile view size.
 * @param {boolean} isToolboxVisible - Whether the toolbox is visible, in order
 * to adjust the available size.
 * @returns {{
 *     type: SET_TILE_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }}
 */
export function setTileViewDimensions(
        dimensions: Object, windowSize: Object, isChatOpen: boolean, isToolboxVisible: boolean) {
    const { clientWidth, clientHeight } = windowSize;
    let heightToUse = clientHeight;
    let widthToUse = clientWidth;

    if (isChatOpen) {
        widthToUse -= CHAT_SIZE;
    }

    if (isToolboxVisible) {
        // The distance from the top and bottom of the screen, to avoid overlapping UI elements.
        heightToUse -= 150;
    }

    const thumbnailSize = calculateThumbnailSizeForTileView({
        ...dimensions,
        clientWidth: widthToUse,
        clientHeight: heightToUse
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
