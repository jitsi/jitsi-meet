// @flow
import type { Dispatch } from 'redux';

import {
    getLocalParticipant,
    getParticipantById,
    getRemoteParticipantCount,
    pinParticipant
} from '../base/participants';
import { shouldHideSelfView } from '../base/settings/functions.any';
import { getMaxColumnCount } from '../video-layout';

import {
    SET_FILMSTRIP_WIDTH,
    SET_HORIZONTAL_VIEW_DIMENSIONS,
    SET_TILE_VIEW_DIMENSIONS,
    SET_USER_FILMSTRIP_WIDTH,
    SET_USER_IS_RESIZING,
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
    TILE_VIEW_DEFAULT_NUMBER_OF_VISIBLE_TILES,
    TILE_VIEW_GRID_HORIZONTAL_MARGIN,
    TILE_VIEW_GRID_VERTICAL_MARGIN,
    VERTICAL_FILMSTRIP_VERTICAL_MARGIN
} from './constants';
import {
    calculateNotResponsiveTileViewDimensions,
    calculateResponsiveTileViewDimensions,
    calculateThumbnailSizeForHorizontalView,
    calculateThumbnailSizeForVerticalView,
    getNumberOfPartipantsForTileView,
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
export function setTileViewDimensions() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
        const {
            disableResponsiveTiles,
            disableTileEnlargement,
            tileView = {}
        } = state['features/base/config'];
        const { numberOfVisibleTiles = TILE_VIEW_DEFAULT_NUMBER_OF_VISIBLE_TILES } = tileView;
        const numberOfParticipants = getNumberOfPartipantsForTileView(state);
        const maxColumns = getMaxColumnCount(state);

        const {
            height,
            width,
            columns,
            rows
        } = disableResponsiveTiles
            ? calculateNotResponsiveTileViewDimensions(state)
            : calculateResponsiveTileViewDimensions({
                clientWidth,
                clientHeight,
                disableTileEnlargement,
                maxColumns,
                numberOfParticipants,
                numberOfVisibleTiles
            });
        const thumbnailsTotalHeight = rows * (TILE_VERTICAL_MARGIN + height);
        const hasScroll = clientHeight < thumbnailsTotalHeight;
        const filmstripWidth
            = Math.min(clientWidth - TILE_VIEW_GRID_HORIZONTAL_MARGIN, columns * (TILE_HORIZONTAL_MARGIN + width))
                + (hasScroll ? SCROLL_SIZE : 0);
        const filmstripHeight = Math.min(clientHeight - TILE_VIEW_GRID_VERTICAL_MARGIN, thumbnailsTotalHeight);

        dispatch({
            type: SET_TILE_VIEW_DIMENSIONS,
            dimensions: {
                gridDimensions: {
                    columns,
                    rows
                },
                thumbnailSize: {
                    height,
                    width
                },
                filmstripHeight,
                filmstripWidth,
                hasScroll
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
        const numberOfRemoteParticipants = getRemoteParticipantCount(state);

        let gridView = {};
        let thumbnails = {};
        let filmstripDimensions = {};
        let hasScroll = false;
        let remoteVideosContainerWidth;
        let remoteVideosContainerHeight;

        // grid view in the vertical filmstrip
        if (_verticalViewGrid) {
            const { tileView = {} } = state['features/base/config'];
            const { numberOfVisibleTiles = TILE_VIEW_DEFAULT_NUMBER_OF_VISIBLE_TILES } = tileView;
            const numberOfParticipants = getNumberOfPartipantsForTileView(state);
            const maxColumns = getMaxColumnCount(state);
            const {
                height,
                width,
                columns,
                rows
            } = calculateResponsiveTileViewDimensions({
                clientWidth: filmstripWidth.current,
                clientHeight,
                disableTileEnlargement: false,
                isVerticalFilmstrip: true,
                maxColumns,
                numberOfParticipants,
                numberOfVisibleTiles
            });
            const thumbnailsTotalHeight = rows * (TILE_VERTICAL_MARGIN + height);

            hasScroll = clientHeight < thumbnailsTotalHeight;
            const widthOfFilmstrip = (columns * (TILE_HORIZONTAL_MARGIN + width)) + (hasScroll ? SCROLL_SIZE : 0);
            const filmstripHeight = Math.min(clientHeight - TILE_VIEW_GRID_VERTICAL_MARGIN, thumbnailsTotalHeight);

            gridView = {
                gridDimensions: {
                    columns,
                    rows
                },
                thumbnailSize: {
                    height,
                    width
                },
                hasScroll
            };

            filmstripDimensions = {
                height: filmstripHeight,
                width: widthOfFilmstrip
            };
        } else {
            thumbnails = calculateThumbnailSizeForVerticalView(clientWidth, filmstripWidth.current, resizableFilmstrip);

            remoteVideosContainerWidth
                = thumbnails?.local?.width + TILE_VERTICAL_CONTAINER_HORIZONTAL_MARGIN + SCROLL_SIZE;
            remoteVideosContainerHeight
                = clientHeight - (disableSelfView ? 0 : thumbnails?.local?.height) - VERTICAL_FILMSTRIP_VERTICAL_MARGIN;
            hasScroll
                = remoteVideosContainerHeight
                    < (thumbnails?.remote.height + TILE_VERTICAL_MARGIN) * numberOfRemoteParticipants;
        }

        dispatch({
            type: SET_VERTICAL_VIEW_DIMENSIONS,
            dimensions: {
                ...thumbnails,
                remoteVideosContainer: _verticalViewGrid ? filmstripDimensions : {
                    width: remoteVideosContainerWidth,
                    height: remoteVideosContainerHeight
                },
                gridView,
                hasScroll
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
        const remoteVideosContainerWidth
            = clientWidth - (disableSelfView ? 0 : thumbnails?.local?.width) - HORIZONTAL_FILMSTRIP_MARGIN;
        const remoteVideosContainerHeight
            = thumbnails?.local?.height + TILE_VERTICAL_MARGIN + STAGE_VIEW_THUMBNAIL_VERTICAL_BORDER + SCROLL_SIZE;
        const numberOfRemoteParticipants = getRemoteParticipantCount(state);
        const hasScroll
            = remoteVideosContainerHeight
                < (thumbnails?.remote.width + TILE_HORIZONTAL_MARGIN) * numberOfRemoteParticipants;

        dispatch({
            type: SET_HORIZONTAL_VIEW_DIMENSIONS,
            dimensions: {
                ...thumbnails,
                remoteVideosContainer: {
                    width: remoteVideosContainerWidth,
                    height: remoteVideosContainerHeight
                },
                hasScroll
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

/**
 * Sets whether the user is resizing or not.
 *
 * @param {boolean} resizing - Whether the user is resizing or not.
 * @returns {Object}
 */
export function setUserIsResizing(resizing: boolean) {
    return {
        type: SET_USER_IS_RESIZING,
        resizing
    };
}
