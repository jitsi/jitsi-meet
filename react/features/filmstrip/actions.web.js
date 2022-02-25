// @flow
import type { Dispatch } from 'redux';

import { getLocalParticipant, getParticipantById, pinParticipant } from '../base/participants';
import { shouldHideSelfView } from '../base/settings/functions.any';
import { getTileViewGridDimensions } from '../video-layout';

import {
    SET_FILMSTRIP_WIDTH,
    SET_HORIZONTAL_VIEW_DIMENSIONS,
    SET_TILE_VIEW_DIMENSIONS,
    SET_USER_FILMSTRIP_WIDTH,
    SET_VERTICAL_VIEW_DIMENSIONS,
    SET_VOLUME
} from './actionTypes';
import {
    HORIZONTAL_FILMSTRIP_MARGIN,
    SCROLL_SIZE,
    STAGE_VIEW_THUMBNAIL_VERTICAL_BORDER,
    TILE_HORIZONTAL_MARGIN,
    TILE_VERTICAL_CONTAINER_HORIZONTAL_MARGIN,
    TILE_VERTICAL_MARGIN,
    VERTICAL_FILMSTRIP_VERTICAL_MARGIN
} from './constants';
import {
    calculateThumbnailSizeForHorizontalView,
    calculateThumbnailSizeForTileView,
    calculateThumbnailSizeForVerticalView,
    isFilmstripResizable,
    showGridInVerticalView
} from './functions';

export * from './actions.any';

/**
 * Sets the dimensions of the tile view grid.
 *
 * @param {Object} dimensions - Whether the filmstrip is visible.
 * @param {Object | Function} stateful - An object or function that can be
 * resolved to Redux state using the {@code toState} function.
 * @returns {Function}
 */
export function setTileViewDimensions(dimensions: Object) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
        const { disableResponsiveTiles, disableTileEnlargement } = state['features/base/config'];
        const {
            height,
            width
        } = calculateThumbnailSizeForTileView({
            ...dimensions,
            clientWidth,
            clientHeight,
            disableResponsiveTiles,
            disableTileEnlargement
        });
        const { columns, rows } = dimensions;
        const thumbnailsTotalHeight = rows * (TILE_VERTICAL_MARGIN + height);
        const hasScroll = clientHeight < thumbnailsTotalHeight;
        const filmstripWidth = (columns * (TILE_HORIZONTAL_MARGIN + width)) + (hasScroll ? SCROLL_SIZE : 0);
        const filmstripHeight = Math.min(clientHeight, thumbnailsTotalHeight);

        dispatch({
            type: SET_TILE_VIEW_DIMENSIONS,
            dimensions: {
                gridDimensions: dimensions,
                thumbnailSize: {
                    height,
                    width
                },
                filmstripHeight,
                filmstripWidth
            }
        });
    };
}

/**
 * Sets the dimensions of the thumbnails in vertical view.
 *
 * @returns {Function}
 */
export function setVerticalViewDimensions() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { clientHeight = 0, clientWidth = 0 } = state['features/base/responsive-ui'];
        const { width: filmstripWidth } = state['features/filmstrip'];
        const disableSelfView = shouldHideSelfView(state);
        const resizableFilmstrip = isFilmstripResizable(state);
        const _verticalViewGrid = showGridInVerticalView(state);

        let gridView = {};
        let thumbnails = {};
        let filmstripDimensions = {};

        // grid view in the vertical filmstrip
        if (_verticalViewGrid) {
            const dimensions = getTileViewGridDimensions(state, filmstripWidth.current);
            const {
                height,
                width
            } = calculateThumbnailSizeForTileView({
                ...dimensions,
                clientWidth: filmstripWidth.current,
                clientHeight,
                disableResponsiveTiles: false,
                disableTileEnlargement: false,
                isVerticalFilmstrip: true
            });
            const { columns, rows } = dimensions;
            const thumbnailsTotalHeight = rows * (TILE_VERTICAL_MARGIN + height);
            const hasScroll = clientHeight < thumbnailsTotalHeight;
            const widthOfFilmstrip = (columns * (TILE_HORIZONTAL_MARGIN + width)) + (hasScroll ? SCROLL_SIZE : 0);
            const filmstripHeight = Math.min(clientHeight, thumbnailsTotalHeight);

            gridView = {
                gridDimensions: dimensions,
                thumbnailSize: {
                    height,
                    width
                }
            };

            filmstripDimensions = {
                height: filmstripHeight,
                width: widthOfFilmstrip
            };
        } else {
            thumbnails = calculateThumbnailSizeForVerticalView(clientWidth, filmstripWidth.current, resizableFilmstrip);
        }

        dispatch({
            type: SET_VERTICAL_VIEW_DIMENSIONS,
            dimensions: {
                ...thumbnails,
                remoteVideosContainer: _verticalViewGrid ? filmstripDimensions : {
                    width: thumbnails?.local?.width
                        + TILE_VERTICAL_CONTAINER_HORIZONTAL_MARGIN + SCROLL_SIZE,
                    height: clientHeight - (disableSelfView ? 0 : thumbnails?.local?.height)
                        - VERTICAL_FILMSTRIP_VERTICAL_MARGIN
                },
                gridView
            }
        });
    };
}

/**
 * Sets the dimensions of the thumbnails in horizontal view.
 *
 * @returns {Function}
 */
export function setHorizontalViewDimensions() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { clientHeight = 0, clientWidth = 0 } = state['features/base/responsive-ui'];
        const disableSelfView = shouldHideSelfView(state);
        const thumbnails = calculateThumbnailSizeForHorizontalView(clientHeight);

        dispatch({
            type: SET_HORIZONTAL_VIEW_DIMENSIONS,
            dimensions: {
                ...thumbnails,
                remoteVideosContainer: {
                    width: clientWidth - (disableSelfView ? 0 : thumbnails?.local?.width) - HORIZONTAL_FILMSTRIP_MARGIN,
                    height: thumbnails?.local?.height
                        + TILE_VERTICAL_MARGIN + STAGE_VIEW_THUMBNAIL_VERTICAL_BORDER + SCROLL_SIZE
                }
            }
        });
    };
}

/**
 * Emulates a click on the n-th video.
 *
 * @param {number} n - Number that identifies the video.
 * @returns {Function}
 */
export function clickOnVideo(n: number) {
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const { id: localId } = getLocalParticipant(state);

        // Use the list that correctly represents the current order of the participants as visible in the UI.
        const { remoteParticipants } = state['features/filmstrip'];
        const participants = [ localId, ...remoteParticipants ];
        const { id, pinned } = getParticipantById(state, participants[n]);

        dispatch(pinParticipant(pinned ? null : id));
    };
}

/**
 * Sets the volume for a thumbnail's audio.
 *
 * @param {string} participantId - The participant ID asociated with the audio.
 * @param {string} volume - The volume level.
 * @returns {{
 *     type: SET_VOLUME,
 *     participantId: string,
 *     volume: number
 * }}
 */
export function setVolume(participantId: string, volume: number) {
    return {
        type: SET_VOLUME,
        participantId,
        volume
    };
}

/**
 * Sets the filmstrip's width.
 *
 * @param {number} width - The new width of the filmstrip.
 * @returns {{
 *      type: SET_FILMSTRIP_WIDTH,
 *      width: number
 * }}
 */
export function setFilmstripWidth(width: number) {
    return {
        type: SET_FILMSTRIP_WIDTH,
        width
    };
}

/**
 * Sets the filmstrip's width and the user preferred width.
 *
 * @param {number} width - The new width of the filmstrip.
 * @returns {{
 *      type: SET_USER_FILMSTRIP_WIDTH,
 *      width: number
 * }}
 */
export function setUserFilmstripWidth(width: number) {
    return {
        type: SET_USER_FILMSTRIP_WIDTH,
        width
    };
}
