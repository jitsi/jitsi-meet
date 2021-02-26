// @flow

import { toState } from '../base/redux';
import { CHAT_SIZE } from '../chat/constants';

import { SET_HORIZONTAL_VIEW_DIMENSIONS, SET_TILE_VIEW_DIMENSIONS } from './actionTypes';
import { calculateThumbnailSizeForHorizontalView, calculateThumbnailSizeForTileView } from './functions';

/**
 * The size of the side margins for the entire tile view area.
 */
const TILE_VIEW_SIDE_MARGINS = 20;

/**
 * Sets the dimensions of the tile view grid.
 *
 * @param {Object} dimensions - Whether the filmstrip is visible.
 * @param {Object} windowSize - The size of the window.
 * @param {Object | Function} stateful - An object or function that can be
 * resolved to Redux state using the {@code toState} function.
 * @returns {{
 *     type: SET_TILE_VIEW_DIMENSIONS,
 *     dimensions: Object
 * }}
 */
export function setTileViewDimensions(dimensions: Object, windowSize: Object, stateful: Object | Function) {
    const state = toState(stateful);
    const { clientWidth, clientHeight } = windowSize;
    const heightToUse = clientHeight;
    let widthToUse = clientWidth;
    const { isOpen } = state['features/chat'];
    const { disableResponsiveTiles } = state['features/base/config'];

    if (isOpen) {
        widthToUse -= CHAT_SIZE;
    }

    const thumbnailSize = calculateThumbnailSizeForTileView({
        ...dimensions,
        clientWidth: widthToUse,
        clientHeight: heightToUse,
        disableResponsiveTiles
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
