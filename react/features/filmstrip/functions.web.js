// @flow

import { getSourceNameSignalingFeatureFlag } from '../base/config';
import { isMobileBrowser } from '../base/environment/utils';
import { MEDIA_TYPE } from '../base/media';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantCountWithFake,
    getPinnedParticipant
} from '../base/participants';
import { toState } from '../base/redux';
import { shouldHideSelfView } from '../base/settings/functions.any';
import {
    getLocalVideoTrack,
    getTrackByMediaTypeAndParticipant,
    isLocalTrackMuted,
    isRemoteTrackMuted
} from '../base/tracks/functions';
import { isTrackStreamingStatusActive, isParticipantConnectionStatusActive } from '../connection-indicator/functions';
import { isSharingStatus } from '../shared-video/functions';
import {
    getCurrentLayout,
    getNotResponsiveTileViewGridDimensions,
    LAYOUTS
} from '../video-layout';

import {
    ASPECT_RATIO_BREAKPOINT,
    DEFAULT_FILMSTRIP_WIDTH,
    DEFAULT_LOCAL_TILE_ASPECT_RATIO,
    DISPLAY_AVATAR,
    DISPLAY_VIDEO,
    FILMSTRIP_GRID_BREAKPOINT,
    INDICATORS_TOOLTIP_POSITION,
    SCROLL_SIZE,
    SQUARE_TILE_ASPECT_RATIO,
    TILE_ASPECT_RATIO,
    TILE_HORIZONTAL_MARGIN,
    TILE_MIN_HEIGHT_LARGE,
    TILE_MIN_HEIGHT_SMALL,
    TILE_PORTRAIT_ASPECT_RATIO,
    TILE_VERTICAL_MARGIN,
    TILE_VIEW_DEFAULT_NUMBER_OF_VISIBLE_TILES,
    TILE_VIEW_GRID_HORIZONTAL_MARGIN,
    TILE_VIEW_GRID_VERTICAL_MARGIN,
    VERTICAL_VIEW_HORIZONTAL_MARGIN
} from './constants';

export * from './functions.any';

declare var interfaceConfig: Object;

/**
 * Returns true if the filmstrip on mobile is visible, false otherwise.
 *
 * NOTE: Filmstrip on web behaves differently to mobile, much simpler, but so
 * function lies here only for the sake of consistency and to avoid flow errors
 * on import.
 *
 * @param {Object | Function} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {boolean}
 */
export function isFilmstripVisible(stateful: Object | Function) {
    return toState(stateful)['features/filmstrip'].visible;
}

/**
 * Determines whether the remote video thumbnails should be displayed/visible in
 * the filmstrip.
 *
 * @param {Object} state - The full redux state.
 * @returns {boolean} - If remote video thumbnails should be displayed/visible
 * in the filmstrip, then {@code true}; otherwise, {@code false}.
 */
export function shouldRemoteVideosBeVisible(state: Object) {
    if (state['features/invite'].calleeInfoVisible) {
        return false;
    }

    // Include fake participants to derive how many thumbnails are dispalyed,
    // as it is assumed all participants, including fake, will be displayed
    // in the filmstrip.
    const participantCount = getParticipantCountWithFake(state);
    let pinnedParticipant;
    const { disable1On1Mode } = state['features/base/config'];
    const { contextMenuOpened } = state['features/base/responsive-ui'];

    return Boolean(
        contextMenuOpened
            || participantCount > 2

            // Always show the filmstrip when there is another participant to
            // show and the  local video is pinned, or the toolbar is displayed.
            || (participantCount > 1
                && disable1On1Mode !== null
                && (state['features/toolbox'].visible
                    || ((pinnedParticipant = getPinnedParticipant(state))
                        && pinnedParticipant.local)))

            || disable1On1Mode);
}

/**
 * Checks whether there is a playable video stream available for the user associated with the passed ID.
 *
 * @param {Object | Function} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @param {string} id - The id of the participant.
 * @returns {boolean} <tt>true</tt> if there is a playable video stream available
 * or <tt>false</tt> otherwise.
 */
export function isVideoPlayable(stateful: Object | Function, id: String) {
    const state = toState(stateful);
    const tracks = state['features/base/tracks'];
    const participant = id ? getParticipantById(state, id) : getLocalParticipant(state);
    const isLocal = participant?.local ?? true;

    const videoTrack
        = isLocal ? getLocalVideoTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, id);
    const isAudioOnly = Boolean(state['features/base/audio-only'].enabled);
    let isPlayable = false;

    if (isLocal) {
        const isVideoMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO);

        isPlayable = Boolean(videoTrack) && !isVideoMuted && !isAudioOnly;
    } else if (!participant?.isFakeParticipant) { // remote participants excluding shared video
        const isVideoMuted = isRemoteTrackMuted(tracks, MEDIA_TYPE.VIDEO, id);

        if (getSourceNameSignalingFeatureFlag(state)) {
            isPlayable = Boolean(videoTrack) && !isVideoMuted && !isAudioOnly
                && isTrackStreamingStatusActive(videoTrack);
        } else {
            isPlayable = Boolean(videoTrack) && !isVideoMuted && !isAudioOnly
                && isParticipantConnectionStatusActive(participant);
        }
    }

    return isPlayable;
}

/**
 * Calculates the size for thumbnails when in horizontal view layout.
 *
 * @param {number} clientHeight - The height of the app window.
 * @returns {{local: {height, width}, remote: {height, width}}}
 */
export function calculateThumbnailSizeForHorizontalView(clientHeight: number = 0) {
    const topBottomMargin = 15;
    const availableHeight = Math.min(clientHeight,
        (interfaceConfig.FILM_STRIP_MAX_HEIGHT || DEFAULT_FILMSTRIP_WIDTH) + topBottomMargin);
    const height = availableHeight - topBottomMargin;

    return {
        local: {
            height,
            width: Math.floor(interfaceConfig.LOCAL_THUMBNAIL_RATIO * height)
        },
        remote: {
            height,
            width: Math.floor(interfaceConfig.REMOTE_THUMBNAIL_RATIO * height)
        }
    };
}

/**
 * Calculates the size for thumbnails when in vertical view layout.
 *
 * @param {number} clientWidth - The height of the app window.
 * @param {number} filmstripWidth - The width of the filmstrip.
 * @param {boolean} isResizable - Whether the filmstrip is resizable or not.
 * @returns {{local: {height, width}, remote: {height, width}}}
 */
export function calculateThumbnailSizeForVerticalView(clientWidth: number = 0,
        filmstripWidth: number = 0, isResizable = false) {
    const availableWidth = Math.min(
        Math.max(clientWidth - VERTICAL_VIEW_HORIZONTAL_MARGIN, 0),
        (isResizable ? filmstripWidth : interfaceConfig.FILM_STRIP_MAX_HEIGHT) || DEFAULT_FILMSTRIP_WIDTH);

    return {
        local: {
            height: Math.floor(availableWidth
                / (interfaceConfig.LOCAL_THUMBNAIL_RATIO || DEFAULT_LOCAL_TILE_ASPECT_RATIO)),
            width: availableWidth
        },
        remote: {
            height: isResizable
                ? DEFAULT_FILMSTRIP_WIDTH
                : Math.floor(availableWidth / interfaceConfig.REMOTE_THUMBNAIL_RATIO),
            width: availableWidth
        }
    };
}

/**
 * Returns the minimum height of a thumbnail.
 *
 * @param {number} clientWidth - The width of the window.
 * @returns {number} The minimum height of a thumbnail.
 */
export function getThumbnailMinHeight(clientWidth) {
    return clientWidth < ASPECT_RATIO_BREAKPOINT ? TILE_MIN_HEIGHT_SMALL : TILE_MIN_HEIGHT_LARGE;
}

/**
 * Returns the default aspect ratio for a tile.
 *
 * @param {boolean} disableResponsiveTiles - Indicates whether the responsive tiles functionality is disabled.
 * @param {boolean} disableTileEnlargement - Indicates whether the tiles enlargement functionality is disabled.
 * @param {number} clientWidth - The width of the window.
 * @returns {number} The default aspect ratio for a tile.
 */
export function getTileDefaultAspectRatio(disableResponsiveTiles, disableTileEnlargement, clientWidth) {
    if (!disableResponsiveTiles && disableTileEnlargement && clientWidth < ASPECT_RATIO_BREAKPOINT) {
        return SQUARE_TILE_ASPECT_RATIO;
    }

    return TILE_ASPECT_RATIO;
}

/**
 * Returns the number of participants that will be displayed in tile view.
 *
 * @param {Object} state - The redux store state.
 * @returns {number} The number of participants that will be displayed in tile view.
 */
export function getNumberOfPartipantsForTileView(state) {
    const { iAmRecorder } = state['features/base/config'];
    const disableSelfView = shouldHideSelfView(state);
    const numberOfParticipants = getParticipantCountWithFake(state)
        - (iAmRecorder ? 1 : 0)
        - (disableSelfView ? 1 : 0);

    return numberOfParticipants;
}

/**
 * Calculates the dimensions (thumbnail width/height and columns/row) for tile view when the responsive tiles are
 * disabled.
 *
 * @param {Object} state - The redux store state.
 * @param {boolean} stageFilmstrip - Whether the dimensions should be calculated for the stage filmstrip.
 * @returns {Object} - The dimensions.
 */
export function calculateNonResponsiveTileViewDimensions(state, stageFilmstrip = false) {
    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const { disableTileEnlargement } = state['features/base/config'];
    const { columns: c, minVisibleRows, rows: r } = getNotResponsiveTileViewGridDimensions(state, stageFilmstrip);
    const filmstripWidth = getVerticalViewMaxWidth(state);
    const size = calculateThumbnailSizeForTileView({
        columns: c,
        minVisibleRows,
        clientWidth: clientWidth - (stageFilmstrip ? filmstripWidth : 0),
        clientHeight,
        disableTileEnlargement,
        disableResponsiveTiles: true
    });

    if (typeof size === 'undefined') { // The columns don't fit into the screen. We will have horizontal scroll.
        const aspectRatio = disableTileEnlargement
            ? getTileDefaultAspectRatio(true, disableTileEnlargement, clientWidth)
            : TILE_PORTRAIT_ASPECT_RATIO;

        const height = getThumbnailMinHeight(clientWidth);

        return {
            height,
            width: aspectRatio * height,
            columns: c,
            rows: r
        };
    }

    return {
        height: size.height,
        width: size.width,
        columns: c,
        rows: r
    };
}

/**
 * Calculates the dimensions (thumbnail width/height and columns/row) for tile view when the responsive tiles are
 * enabled.
 *
 * @param {Object} state - The redux store state.
 * @returns {Object} - The dimensions.
 */
export function calculateResponsiveTileViewDimensions({
    clientWidth,
    clientHeight,
    disableTileEnlargement = false,
    noHorizontalContainerMargin = false,
    maxColumns,
    numberOfParticipants,
    numberOfVisibleTiles = TILE_VIEW_DEFAULT_NUMBER_OF_VISIBLE_TILES
}) {
    let height, width;
    let columns, rows;
    let dimensions = {
        maxArea: 0
    };
    let minHeightEnforcedDimensions = {
        maxArea: 0
    };
    let zeroVisibleRowsDimensions = {
        maxArea: 0
    };

    for (let c = 1; c <= Math.min(maxColumns, numberOfParticipants); c++) {
        const r = Math.ceil(numberOfParticipants / c);

        // we want to display as much as possible tumbnails up to numberOfVisibleTiles
        const visibleRows
            = numberOfParticipants <= numberOfVisibleTiles ? r : Math.floor(numberOfVisibleTiles / c);

        const size = calculateThumbnailSizeForTileView({
            columns: c,
            minVisibleRows: visibleRows,
            clientWidth,
            clientHeight,
            disableTileEnlargement,
            disableResponsiveTiles: false,
            noHorizontalContainerMargin
        });

        if (size) {
            const { height: currentHeight, width: currentWidth, minHeightEnforced, maxVisibleRows } = size;
            let area = currentHeight * currentWidth * Math.min(c * maxVisibleRows, numberOfParticipants);
            const currentDimensions = {
                maxArea: area,
                height: currentHeight,
                width: currentWidth,
                columns: c,
                rows: r
            };

            if (!minHeightEnforced && area > dimensions.maxArea) {
                dimensions = currentDimensions;
            } else if (minHeightEnforced && area > minHeightEnforcedDimensions.maxArea) {
                minHeightEnforcedDimensions = currentDimensions;
            } else if (minHeightEnforced && maxVisibleRows === 0) {
                area = currentHeight * currentWidth * Math.min(c, numberOfParticipants);

                if (area > zeroVisibleRowsDimensions.maxArea) {
                    zeroVisibleRowsDimensions = {
                        ...currentDimensions,
                        maxArea: area
                    };
                }
            }
        }
    }

    if (dimensions.maxArea > 0) {
        ({ height, width, columns, rows } = dimensions);
    } else if (minHeightEnforcedDimensions.maxArea > 0) {
        ({ height, width, columns, rows } = minHeightEnforcedDimensions);
    } else if (zeroVisibleRowsDimensions.maxArea > 0) {
        ({ height, width, columns, rows } = zeroVisibleRowsDimensions);
    } else { // This would mean that we can't fit even one thumbnail with minimal size.
        const aspectRatio = disableTileEnlargement
            ? getTileDefaultAspectRatio(false, disableTileEnlargement, clientWidth)
            : TILE_PORTRAIT_ASPECT_RATIO;

        height = getThumbnailMinHeight(clientWidth);
        width = aspectRatio * height;
        columns = 1;
        rows = numberOfParticipants;
    }

    return {
        height,
        width,
        columns,
        rows
    };
}

/**
 * Calculates the size for thumbnails when in tile view layout.
 *
 * @param {Object} dimensions - The desired dimensions of the tile view grid.
 * @returns {{hasScroll, height, width}}
 */
export function calculateThumbnailSizeForTileView({
    columns,
    minVisibleRows,
    clientWidth,
    clientHeight,
    disableResponsiveTiles = false,
    disableTileEnlargement = false,
    noHorizontalContainerMargin = false
}: Object) {
    const aspectRatio = getTileDefaultAspectRatio(disableResponsiveTiles, disableTileEnlargement, clientWidth);
    const minHeight = getThumbnailMinHeight(clientWidth);
    const viewWidth = clientWidth - (columns * TILE_HORIZONTAL_MARGIN)
        - (noHorizontalContainerMargin ? SCROLL_SIZE : TILE_VIEW_GRID_HORIZONTAL_MARGIN);
    const viewHeight = clientHeight - (minVisibleRows * TILE_VERTICAL_MARGIN) - TILE_VIEW_GRID_VERTICAL_MARGIN;
    const initialWidth = viewWidth / columns;
    let initialHeight = viewHeight / minVisibleRows;
    let minHeightEnforced = false;

    if (initialHeight < minHeight) {
        minHeightEnforced = true;
        initialHeight = minHeight;
    }

    if (disableTileEnlargement) {
        const aspectRatioHeight = initialWidth / aspectRatio;

        if (aspectRatioHeight < minHeight) { // we can't fit the required number of columns.
            return;
        }

        const height = Math.floor(Math.min(aspectRatioHeight, initialHeight));

        return {
            height,
            width: Math.floor(aspectRatio * height),
            minHeightEnforced,
            maxVisibleRows: Math.floor(viewHeight / height)
        };
    }

    const initialRatio = initialWidth / initialHeight;
    let height = Math.floor(initialHeight);

    // The biggest area of the grid will be when the grid's height is equal to clientHeight or when the grid's width is
    // equal to clientWidth.

    if (initialRatio > aspectRatio) {
        return {
            height,
            width: Math.floor(initialHeight * aspectRatio),
            minHeightEnforced,
            maxVisibleRows: Math.floor(viewHeight / height)
        };
    } else if (initialRatio >= TILE_PORTRAIT_ASPECT_RATIO) {
        return {
            height,
            width: Math.floor(initialWidth),
            minHeightEnforced,
            maxVisibleRows: Math.floor(viewHeight / height)
        };
    } else if (!minHeightEnforced) {
        height = Math.floor(initialWidth / TILE_PORTRAIT_ASPECT_RATIO);

        if (height >= minHeight) {
            return {
                height,
                width: Math.floor(initialWidth),
                minHeightEnforced,
                maxVisibleRows: Math.floor(viewHeight / height)
            };
        }
    }

    // else
    // We can't fit that number of columns with the desired min height and aspect ratio.
    return;
}

/**
 * Returns the width of the visible area (doesn't include the left margin/padding) of the the vertical filmstrip.
 *
 * @returns {number} - The width of the vertical filmstrip.
 */
export function getVerticalFilmstripVisibleAreaWidth() {
    // Adding 11px for the 2px right margin, 2px borders on the left and right and 5px right padding.
    // Also adding 7px for the scrollbar. Note that we are not counting the left margins and paddings because this
    // function is used for calculating the available space and they are invisible.
    // TODO: Check if we can remove the left margins and paddings from the CSS.
    // FIXME: This function is used to calculate the size of the large video, etherpad or shared video. Once everything
    // is reactified this calculation will need to move to the corresponding components.
    const filmstripMaxWidth = (interfaceConfig.FILM_STRIP_MAX_HEIGHT || DEFAULT_FILMSTRIP_WIDTH) + 18;

    return Math.min(filmstripMaxWidth, window.innerWidth);
}

/**
 * Computes information that determine the display mode.
 *
 * @param {Object} input - Object containing all necessary information for determining the display mode for
 * the thumbnail.
 * @returns {number} - One of <tt>DISPLAY_VIDEO</tt> or <tt>DISPLAY_AVATAR</tt>.
*/
export function computeDisplayModeFromInput(input: Object) {
    const {
        isActiveParticipant,
        isAudioOnly,
        isCurrentlyOnLargeVideo,
        isScreenSharing,
        canPlayEventReceived,
        isRemoteParticipant,
        tileViewActive
    } = input;
    const adjustedIsVideoPlayable = input.isVideoPlayable && (!isRemoteParticipant || canPlayEventReceived);

    if (!tileViewActive && ((isScreenSharing && isRemoteParticipant) || isActiveParticipant)) {
        return DISPLAY_AVATAR;
    } else if (isCurrentlyOnLargeVideo && !tileViewActive) {
        // Display name is always and only displayed when user is on the stage
        return adjustedIsVideoPlayable && !isAudioOnly ? DISPLAY_VIDEO : DISPLAY_AVATAR;
    } else if (adjustedIsVideoPlayable && !isAudioOnly) {
        // check hovering and change state to video with name
        return DISPLAY_VIDEO;
    }

    // check hovering and change state to avatar with name
    return DISPLAY_AVATAR;
}

/**
 * Extracts information for props and state needed to compute the display mode.
 *
 * @param {Object} props - The Thumbnail component's props.
 * @param {Object} state - The Thumbnail component's state.
 * @returns {Object}
*/
export function getDisplayModeInput(props: Object, state: Object) {
    const {
        _currentLayout,
        _isActiveParticipant,
        _isAudioOnly,
        _isCurrentlyOnLargeVideo,
        _isScreenSharing,
        _isVideoPlayable,
        _participant,
        _videoTrack
    } = props;
    const tileViewActive = _currentLayout === LAYOUTS.TILE_VIEW;
    const { canPlayEventReceived } = state;

    return {
        isActiveParticipant: _isActiveParticipant,
        isCurrentlyOnLargeVideo: _isCurrentlyOnLargeVideo,
        isAudioOnly: _isAudioOnly,
        tileViewActive,
        isVideoPlayable: _isVideoPlayable,
        connectionStatus: _participant?.connectionStatus,
        canPlayEventReceived,
        videoStream: Boolean(_videoTrack),
        isRemoteParticipant: !_participant?.isFakeParticipant && !_participant?.local,
        isScreenSharing: _isScreenSharing,
        videoStreamMuted: _videoTrack ? _videoTrack.muted : 'no stream'
    };
}

/**
 * Gets the tooltip position for the thumbnail indicators.
 *
 * @param {string} currentLayout - The current layout of the app.
 * @returns {string}
 */
export function getIndicatorsTooltipPosition(currentLayout: string) {
    return INDICATORS_TOOLTIP_POSITION[currentLayout] || 'top';
}

/**
 * Returns whether or not the filmstrip is resizable.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function isFilmstripResizable(state: Object) {
    const { filmstrip } = state['features/base/config'];
    const _currentLayout = getCurrentLayout(state);

    return !filmstrip?.disableResizable && !isMobileBrowser()
        && _currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW;
}

/**
 * Whether or not grid should be displayed in the vertical filmstrip.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function showGridInVerticalView(state) {
    const resizableFilmstrip = isFilmstripResizable(state);
    const { width } = state['features/filmstrip'];

    return resizableFilmstrip && ((width.current ?? 0) > FILMSTRIP_GRID_BREAKPOINT);
}

/**
 * Gets the vertical filmstrip max width.
 *
 * @param {Object} state - Redux state.
 * @returns {number}
 */
export function getVerticalViewMaxWidth(state) {
    const { width } = state['features/filmstrip'];
    const _resizableFilmstrip = isFilmstripResizable(state);
    const _verticalViewGrid = showGridInVerticalView(state);
    let maxWidth = _resizableFilmstrip
        ? width.current || DEFAULT_FILMSTRIP_WIDTH
        : interfaceConfig.FILM_STRIP_MAX_HEIGHT || DEFAULT_FILMSTRIP_WIDTH;

    // Adding 4px for the border-right and margin-right.
    // On non-resizable filmstrip add 4px for the left margin and border.
    // Also adding 7px for the scrollbar. Also adding 9px for the drag handle.
    maxWidth += (_verticalViewGrid ? 0 : 11) + (_resizableFilmstrip ? 9 : 4);

    return maxWidth;
}

/**
 * Returns true if thumbnail reordering is enabled and false otherwise.
 * Note: The function will return false if all participants are displayed on the screen.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} - True if thumbnail reordering is enabled and false otherwise.
 */
export function isReorderingEnabled(state) {
    const { testing = {} } = state['features/base/config'];
    const enableThumbnailReordering = testing.enableThumbnailReordering ?? true;

    return enableThumbnailReordering && isFilmstripScrollVisible(state);
}

/**
 * Returns true if the scroll is displayed and false otherwise.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} - True if the scroll is displayed and false otherwise.
 */
export function isFilmstripScrollVisible(state) {
    const _currentLayout = getCurrentLayout(state);
    let hasScroll = false;

    switch (_currentLayout) {
    case LAYOUTS.TILE_VIEW:
        ({ hasScroll = false } = state['features/filmstrip'].tileViewDimensions);
        break;
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW: {
        ({ hasScroll = false } = state['features/filmstrip'].verticalViewDimensions);
        break;
    }
    case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
        ({ hasScroll = false } = state['features/filmstrip'].horizontalViewDimensions);
        break;
    }
    }

    return hasScroll;
}

/**
 * Gets the ids of the active participants.
 *
 * @param {Object} state - Redux state.
 * @returns {Array<string>}
 */
export function getActiveParticipantsIds(state) {
    const { activeParticipants } = state['features/filmstrip'];

    return activeParticipants.map(p => p.participantId);
}

/**
 * Get whether or not the stage filmstrip should be displayed.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function shouldDisplayStageFilmstrip(state) {
    const { activeParticipants } = state['features/filmstrip'];
    const { remoteScreenShares } = state['features/video-layout'];
    const currentLayout = getCurrentLayout(state);
    const sharedVideo = isSharingStatus(state['features/shared-video']?.status);

    return isStageFilmstripEnabled(state) && remoteScreenShares.length === 0 && !sharedVideo
        && activeParticipants.length > 1 && currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW;
}

/**
 * Whether the stage filmstrip is disabled or not.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function isStageFilmstripEnabled(state) {
    const { filmstrip } = state['features/base/config'];

    return !filmstrip?.disableStageFilmstrip && interfaceConfig.VERTICAL_FILMSTRIP;
}
