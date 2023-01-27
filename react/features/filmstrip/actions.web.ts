import { IStore } from '../app/types';
import { pinParticipant } from '../base/participants/actions';
import {
    getLocalParticipant,
    getParticipantById,
    getRemoteParticipantCountWithFake
} from '../base/participants/functions';
import { getHideSelfView } from '../base/settings/functions.any';
import { getMaxColumnCount } from '../video-layout/functions.web';

import {
    ADD_STAGE_PARTICIPANT,
    CLEAR_STAGE_PARTICIPANTS,
    REMOVE_STAGE_PARTICIPANT,
    RESIZE_FILMSTRIP,
    SET_FILMSTRIP_HEIGHT,
    SET_FILMSTRIP_WIDTH,
    SET_HORIZONTAL_VIEW_DIMENSIONS,
    SET_SCREENSHARE_FILMSTRIP_PARTICIPANT,
    SET_SCREENSHARING_TILE_DIMENSIONS,
    SET_STAGE_FILMSTRIP_DIMENSIONS,
    SET_STAGE_PARTICIPANTS,
    SET_TILE_VIEW_DIMENSIONS,
    SET_TOP_PANEL_VISIBILITY,
    SET_USER_FILMSTRIP_HEIGHT,
    SET_USER_FILMSTRIP_WIDTH,
    SET_USER_IS_RESIZING,
    SET_VERTICAL_VIEW_DIMENSIONS,
    SET_VOLUME,
    TOGGLE_PIN_STAGE_PARTICIPANT
} from './actionTypes';
import {
    HORIZONTAL_FILMSTRIP_MARGIN,
    MAX_ACTIVE_PARTICIPANTS,
    SCROLL_SIZE,
    STAGE_VIEW_THUMBNAIL_VERTICAL_BORDER,
    TILE_HORIZONTAL_MARGIN,
    TILE_MIN_HEIGHT_SMALL,
    TILE_VERTICAL_CONTAINER_HORIZONTAL_MARGIN,
    TILE_VERTICAL_MARGIN,
    TILE_VIEW_DEFAULT_NUMBER_OF_VISIBLE_TILES,
    TILE_VIEW_GRID_HORIZONTAL_MARGIN,
    TILE_VIEW_GRID_VERTICAL_MARGIN,
    TOP_FILMSTRIP_HEIGHT,
    VERTICAL_FILMSTRIP_VERTICAL_MARGIN
} from './constants';
import {
    calculateNonResponsiveTileViewDimensions,
    calculateResponsiveTileViewDimensions,
    calculateThumbnailSizeForHorizontalView,
    calculateThumbnailSizeForVerticalView,
    getNumberOfPartipantsForTileView,
    getVerticalViewMaxWidth,
    isFilmstripResizable,
    isStageFilmstripAvailable,
    isStageFilmstripTopPanel
    , showGridInVerticalView } from './functions.web';

export * from './actions.any';

/**
 * Resize the filmstrip.
 *
 * @param {number} width - Width value for filmstrip.
 *
 * @returns {{
 *  type: RESIZE_FILMSTRIP,
 *  width: number,
 * }}
 */
export function resizeFilmStrip(width: number) {
    return {
        type: RESIZE_FILMSTRIP,
        width
    };
}

/**
 * Sets the dimensions of the tile view grid.
 *
 * @returns {Function}
 */
export function setTileViewDimensions() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
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
            ? calculateNonResponsiveTileViewDimensions(state)
            : calculateResponsiveTileViewDimensions({
                clientWidth,
                clientHeight,
                disableTileEnlargement,
                maxColumns,
                numberOfParticipants,
                desiredNumberOfVisibleTiles: numberOfVisibleTiles
            });
        const thumbnailsTotalHeight = (rows ?? 1) * (TILE_VERTICAL_MARGIN + (height ?? 0));
        const availableHeight = clientHeight - TILE_VIEW_GRID_VERTICAL_MARGIN;
        const hasScroll = availableHeight < thumbnailsTotalHeight;
        const filmstripWidth
            = Math.min(clientWidth - TILE_VIEW_GRID_HORIZONTAL_MARGIN,
                (columns ?? 1) * (TILE_HORIZONTAL_MARGIN + (width ?? 0)))
                + (hasScroll ? SCROLL_SIZE : 0);
        const filmstripHeight = Math.min(availableHeight, thumbnailsTotalHeight);

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
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { clientHeight = 0, clientWidth = 0 } = state['features/base/responsive-ui'];
        const { width: filmstripWidth } = state['features/filmstrip'];
        const disableSelfView = getHideSelfView(state);
        const resizableFilmstrip = isFilmstripResizable(state);
        const _verticalViewGrid = showGridInVerticalView(state);
        const numberOfRemoteParticipants = getRemoteParticipantCountWithFake(state);
        const { localScreenShare } = state['features/base/participants'];

        let gridView = {};
        let thumbnails: any = {};
        let filmstripDimensions = {};
        let hasScroll = false;
        let remoteVideosContainerWidth;
        let remoteVideosContainerHeight;

        // grid view in the vertical filmstrip
        if (_verticalViewGrid) {
            const { tileView = {} } = state['features/base/config'];
            const { numberOfVisibleTiles = TILE_VIEW_DEFAULT_NUMBER_OF_VISIBLE_TILES } = tileView;
            const numberOfParticipants = getNumberOfPartipantsForTileView(state);
            const maxColumns = getMaxColumnCount(state, {
                width: filmstripWidth.current,
                disableResponsiveTiles: false,
                disableTileEnlargement: false
            });
            const {
                height,
                width,
                columns,
                rows
            } = calculateResponsiveTileViewDimensions({
                clientWidth: filmstripWidth.current ?? 0,
                clientHeight,
                disableTileEnlargement: false,
                maxColumns,
                noHorizontalContainerMargin: true,
                numberOfParticipants,
                desiredNumberOfVisibleTiles: numberOfVisibleTiles
            });
            const thumbnailsTotalHeight = (rows ?? 1) * (TILE_VERTICAL_MARGIN + (height ?? 0));

            hasScroll = clientHeight < thumbnailsTotalHeight;
            const widthOfFilmstrip = ((columns ?? 1) * (TILE_HORIZONTAL_MARGIN + (width ?? 0)))
                + (hasScroll ? SCROLL_SIZE : 0);
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
            thumbnails = calculateThumbnailSizeForVerticalView(clientWidth, filmstripWidth.current ?? 0,
                resizableFilmstrip);

            remoteVideosContainerWidth
                = thumbnails?.local?.width + TILE_VERTICAL_CONTAINER_HORIZONTAL_MARGIN + SCROLL_SIZE;
            remoteVideosContainerHeight
                = clientHeight - (disableSelfView ? 0 : thumbnails?.local?.height) - VERTICAL_FILMSTRIP_VERTICAL_MARGIN;

            // Account for the height of the local screen share thumbnail when calculating the height of the remote
            // videos container.
            const localCameraThumbnailHeight = thumbnails?.local?.height;
            const localScreenShareThumbnailHeight
                = localScreenShare && !disableSelfView ? thumbnails?.local?.height : 0;

            remoteVideosContainerHeight = clientHeight
                - localCameraThumbnailHeight
                - localScreenShareThumbnailHeight
                - VERTICAL_FILMSTRIP_VERTICAL_MARGIN;

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
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { clientHeight = 0, clientWidth = 0 } = state['features/base/responsive-ui'];
        const disableSelfView = getHideSelfView(state);
        const thumbnails = calculateThumbnailSizeForHorizontalView(clientHeight);
        const remoteVideosContainerWidth
            = clientWidth - (disableSelfView ? 0 : thumbnails?.local?.width) - HORIZONTAL_FILMSTRIP_MARGIN;
        const remoteVideosContainerHeight
            = thumbnails?.local?.height + TILE_VERTICAL_MARGIN + STAGE_VIEW_THUMBNAIL_VERTICAL_BORDER + SCROLL_SIZE;
        const numberOfRemoteParticipants = getRemoteParticipantCountWithFake(state);
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
 * Sets the dimensions of the stage filmstrip tile view grid.
 *
 * @returns {Function}
 */
export function setStageFilmstripViewDimensions() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
        const {
            tileView = {}
        } = state['features/base/config'];
        const { visible, topPanelHeight } = state['features/filmstrip'];
        const verticalWidth = visible ? getVerticalViewMaxWidth(state) : 0;
        const { numberOfVisibleTiles = MAX_ACTIVE_PARTICIPANTS } = tileView;
        const numberOfParticipants = state['features/filmstrip'].activeParticipants.length;
        const availableWidth = clientWidth - verticalWidth;
        const maxColumns = getMaxColumnCount(state, {
            width: availableWidth,
            disableResponsiveTiles: false,
            disableTileEnlargement: false
        });
        const topPanel = isStageFilmstripTopPanel(state);

        const {
            height,
            width,
            columns,
            rows
        } = calculateResponsiveTileViewDimensions({
            clientWidth: availableWidth,
            clientHeight: topPanel ? topPanelHeight?.current || TOP_FILMSTRIP_HEIGHT : clientHeight,
            disableTileEnlargement: false,
            maxColumns,
            noHorizontalContainerMargin: verticalWidth > 0,
            numberOfParticipants,
            desiredNumberOfVisibleTiles: numberOfVisibleTiles,
            minTileHeight: topPanel ? TILE_MIN_HEIGHT_SMALL : null
        });
        const thumbnailsTotalHeight = (rows ?? 1) * (TILE_VERTICAL_MARGIN + (height ?? 0));
        const hasScroll = clientHeight < thumbnailsTotalHeight;
        const filmstripWidth
            = Math.min(clientWidth - TILE_VIEW_GRID_HORIZONTAL_MARGIN,
                (columns ?? 1) * (TILE_HORIZONTAL_MARGIN + (width ?? 0)))
            + (hasScroll ? SCROLL_SIZE : 0);
        const filmstripHeight = Math.min(clientHeight - TILE_VIEW_GRID_VERTICAL_MARGIN, thumbnailsTotalHeight);

        dispatch({
            type: SET_STAGE_FILMSTRIP_DIMENSIONS,
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
 * Emulates a click on the n-th video.
 *
 * @param {number} n - Number that identifies the video.
 * @returns {Function}
 */
export function clickOnVideo(n: number) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { id: localId } = getLocalParticipant(state) ?? {};

        // Use the list that correctly represents the current order of the participants as visible in the UI.
        const { remoteParticipants } = state['features/filmstrip'];
        const participants = [ localId, ...remoteParticipants ];

        if (participants.length - 1 < n) {
            return;
        }
        const { id, pinned } = getParticipantById(state, participants[n] ?? '') ?? {};

        if (isStageFilmstripAvailable(state)) {
            dispatch(togglePinStageParticipant(id ?? ''));
        } else {
            dispatch(pinParticipant(pinned ? null : id));
        }
    };
}

/**
 * Sets the volume for a thumbnail's audio.
 *
 * @param {string} participantId - The participant ID associated with the audio.
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
 * Sets the top filmstrip's height.
 *
 * @param {number} height - The new height of the filmstrip.
 * @returns {{
 *      type: SET_FILMSTRIP_HEIGHT,
 *      height: number
 * }}
 */
export function setFilmstripHeight(height: number) {
    return {
        type: SET_FILMSTRIP_HEIGHT,
        height
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
 * Sets the filmstrip's height and the user preferred height.
 *
 * @param {number} height - The new height of the filmstrip.
 * @returns {{
 *      type: SET_USER_FILMSTRIP_WIDTH,
 *      height: number
 * }}
 */
export function setUserFilmstripHeight(height: number) {
    return {
        type: SET_USER_FILMSTRIP_HEIGHT,
        height
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

/**
 * Add participant to the active participants list.
 *
 * @param {string} participantId - The Id of the participant to be added.
 * @param {boolean?} pinned - Whether the participant is pinned or not.
 * @returns {Object}
 */
export function addStageParticipant(participantId: string, pinned = false) {
    return {
        type: ADD_STAGE_PARTICIPANT,
        participantId,
        pinned
    };
}

/**
 * Remove participant from the active participants list.
 *
 * @param {string} participantId - The Id of the participant to be removed.
 * @returns {Object}
 */
export function removeStageParticipant(participantId: string) {
    return {
        type: REMOVE_STAGE_PARTICIPANT,
        participantId
    };
}

/**
 * Sets the active participants list.
 *
 * @param {Array<Object>} queue - The new list.
 * @returns {Object}
 */
export function setStageParticipants(queue: Object[]) {
    return {
        type: SET_STAGE_PARTICIPANTS,
        queue
    };
}

/**
 * Toggles the pin state of the given participant.
 *
 * @param {string} participantId - The id of the participant to be toggled.
 * @returns {Object}
 */
export function togglePinStageParticipant(participantId: string) {
    return {
        type: TOGGLE_PIN_STAGE_PARTICIPANT,
        participantId
    };
}

/**
 * Clears the stage participants list.
 *
 * @returns {Object}
 */
export function clearStageParticipants() {
    return {
        type: CLEAR_STAGE_PARTICIPANTS
    };
}

/**
 * Set the screensharing tile dimensions.
 *
 * @returns {Object}
 */
export function setScreensharingTileDimensions() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
        const { visible, topPanelHeight, topPanelVisible } = state['features/filmstrip'];
        const verticalWidth = visible ? getVerticalViewMaxWidth(state) : 0;
        const availableWidth = clientWidth - verticalWidth;
        const topPanel = isStageFilmstripTopPanel(state) && topPanelVisible;
        const availableHeight = clientHeight - (topPanel ? topPanelHeight?.current || TOP_FILMSTRIP_HEIGHT : 0);

        dispatch({
            type: SET_SCREENSHARING_TILE_DIMENSIONS,
            dimensions: {
                filmstripHeight: availableHeight,
                filmstripWidth: availableWidth,
                thumbnailSize: {
                    width: availableWidth - TILE_HORIZONTAL_MARGIN,
                    height: availableHeight - TILE_VERTICAL_MARGIN
                }
            }
        });
    };
}

/**
 * Sets the visibility of the top panel.
 *
 * @param {boolean} visible - Whether it should be visible or not.
 * @returns {Object}
 */
export function setTopPanelVisible(visible: boolean) {
    return {
        type: SET_TOP_PANEL_VISIBILITY,
        visible
    };
}

/**
 * Sets the participant whose screenshare to be displayed on the filmstrip.
 *
 * @param {string|undefined} participantId - The id of the participant to be set.
 * @returns {Object}
 */
export function setScreenshareFilmstripParticipant(participantId?: string) {
    return {
        type: SET_SCREENSHARE_FILMSTRIP_PARTICIPANT,
        participantId
    };
}
