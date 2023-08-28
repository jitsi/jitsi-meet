import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { isMobileBrowser } from '../base/environment/utils';
import { MEDIA_TYPE } from '../base/media/constants';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantCount,
    getParticipantCountWithFake,
    getPinnedParticipant,
    isScreenShareParticipant
} from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { getHideSelfView } from '../base/settings/functions.any';
import {
    getVideoTrackByParticipant,
    isLocalTrackMuted,
    isRemoteTrackMuted
} from '../base/tracks/functions';
import { isTrackStreamingStatusActive } from '../connection-indicator/functions';
import { isSharingStatus } from '../shared-video/functions';
import { LAYOUTS } from '../video-layout/constants';
import { getCurrentLayout, getNotResponsiveTileViewGridDimensions } from '../video-layout/functions.web';

import {
    ASPECT_RATIO_BREAKPOINT,
    DEFAULT_FILMSTRIP_WIDTH,
    DEFAULT_LOCAL_TILE_ASPECT_RATIO,
    DISPLAY_AVATAR,
    DISPLAY_VIDEO,
    FILMSTRIP_GRID_BREAKPOINT,
    FILMSTRIP_TYPE,
    INDICATORS_TOOLTIP_POSITION,
    SCROLL_SIZE,
    SQUARE_TILE_ASPECT_RATIO,
    THUMBNAIL_TYPE,
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

/**
 * Returns true if the filmstrip on mobile is visible, false otherwise.
 *
 * NOTE: Filmstrip on web behaves differently to mobile, much simpler, but so
 * function lies here only for the sake of consistency and to avoid flow errors
 * on import.
 *
 * @param {IStateful} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {boolean}
 */
export function isFilmstripVisible(stateful: IStateful) {
    return toState(stateful)['features/filmstrip'].visible;
}

/**
 * Determines whether the remote video thumbnails should be displayed/visible in
 * the filmstrip.
 *
 * @param {IReduxState} state - The full redux state.
 * @returns {boolean} - If remote video thumbnails should be displayed/visible
 * in the filmstrip, then {@code true}; otherwise, {@code false}.
 */
export function shouldRemoteVideosBeVisible(state: IReduxState) {
    if (state['features/invite'].calleeInfoVisible) {
        return false;
    }

    // Include fake participants to derive how many thumbnails are displayed,
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
 * @param {IStateful} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @param {string} id - The id of the participant.
 * @returns {boolean} <tt>true</tt> if there is a playable video stream available
 * or <tt>false</tt> otherwise.
 */
export function isVideoPlayable(stateful: IStateful, id: string) {
    const state = toState(stateful);
    const tracks = state['features/base/tracks'];
    const participant = id ? getParticipantById(state, id) : getLocalParticipant(state);
    const isLocal = participant?.local ?? true;
    const videoTrack = getVideoTrackByParticipant(state, participant);
    const isAudioOnly = Boolean(state['features/base/audio-only'].enabled);
    let isPlayable = false;

    if (isLocal) {
        const isVideoMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO);

        isPlayable = Boolean(videoTrack) && !isVideoMuted && !isAudioOnly;
    } else if (!participant?.fakeParticipant || isScreenShareParticipant(participant)) {
        // remote participants excluding shared video
        const isVideoMuted = isRemoteTrackMuted(tracks, MEDIA_TYPE.VIDEO, id);

        isPlayable = Boolean(videoTrack) && !isVideoMuted && !isAudioOnly && isTrackStreamingStatusActive(videoTrack);
    }

    return isPlayable;
}

/**
 * Calculates the size for thumbnails when in horizontal view layout.
 *
 * @param {number} clientHeight - The height of the app window.
 * @returns {{local: {height, width}, remote: {height, width}}}
 */
export function calculateThumbnailSizeForHorizontalView(clientHeight = 0) {
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
export function calculateThumbnailSizeForVerticalView(clientWidth = 0, filmstripWidth = 0, isResizable = false) {
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
export function getThumbnailMinHeight(clientWidth: number) {
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
export function getTileDefaultAspectRatio(disableResponsiveTiles: boolean,
        disableTileEnlargement: boolean, clientWidth: number) {
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
export function getNumberOfPartipantsForTileView(state: IReduxState) {
    const { iAmRecorder } = state['features/base/config'];
    const disableSelfView = getHideSelfView(state);
    const { localScreenShare } = state['features/base/participants'];
    const localParticipantsCount = localScreenShare ? 2 : 1;
    const numberOfParticipants = getParticipantCountWithFake(state)
        - (iAmRecorder ? 1 : 0)
        - (disableSelfView ? localParticipantsCount : 0);

    return numberOfParticipants;
}

/**
 * Calculates the dimensions (thumbnail width/height and columns/row) for tile view when the responsive tiles are
 * disabled.
 *
 * @param {Object} state - The redux store state.
 * @returns {Object} - The dimensions.
 */
export function calculateNonResponsiveTileViewDimensions(state: IReduxState) {
    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const { disableTileEnlargement } = state['features/base/config'];
    const { columns: c, minVisibleRows, rows: r } = getNotResponsiveTileViewGridDimensions(state);
    const size = calculateThumbnailSizeForTileView({
        columns: c,
        minVisibleRows,
        clientWidth,
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
    desiredNumberOfVisibleTiles = TILE_VIEW_DEFAULT_NUMBER_OF_VISIBLE_TILES,
    minTileHeight
}: {
    clientHeight: number;
    clientWidth: number;
    desiredNumberOfVisibleTiles: number;
    disableTileEnlargement?: boolean;
    maxColumns: number;
    minTileHeight?: number | null;
    noHorizontalContainerMargin?: boolean;
    numberOfParticipants: number;
}) {
    let height, width;
    let columns, rows;

    interface IDimensions {
        columns?: number;
        height?: number;
        maxArea: number;
        numberOfVisibleParticipants?: number;
        rows?: number;
        width?: number;
    }

    let dimensions: IDimensions = {
        maxArea: 0
    };
    let minHeightEnforcedDimensions: IDimensions = {
        maxArea: 0
    };
    let zeroVisibleRowsDimensions: IDimensions = {
        maxArea: 0
    };

    for (let c = 1; c <= Math.min(maxColumns, numberOfParticipants, desiredNumberOfVisibleTiles); c++) {
        const r = Math.ceil(numberOfParticipants / c);

        // we want to display as much as possible tumbnails up to desiredNumberOfVisibleTiles
        const visibleRows
            = numberOfParticipants <= desiredNumberOfVisibleTiles ? r : Math.floor(desiredNumberOfVisibleTiles / c);

        const size = calculateThumbnailSizeForTileView({
            columns: c,
            minVisibleRows: visibleRows,
            clientWidth,
            clientHeight,
            disableTileEnlargement,
            disableResponsiveTiles: false,
            noHorizontalContainerMargin,
            minTileHeight
        });

        if (size) {
            const { height: currentHeight, width: currentWidth, minHeightEnforced, maxVisibleRows } = size;
            const numberOfVisibleParticipants = Math.min(c * maxVisibleRows, numberOfParticipants);

            let area = Math.round(
                (currentHeight + TILE_VERTICAL_MARGIN)
                * (currentWidth + TILE_HORIZONTAL_MARGIN)
                * numberOfVisibleParticipants);

            const currentDimensions = {
                maxArea: area,
                height: currentHeight,
                width: currentWidth,
                columns: c,
                rows: r,
                numberOfVisibleParticipants
            };
            const { numberOfVisibleParticipants: oldNumberOfVisibleParticipants = 0 } = dimensions;

            if (!minHeightEnforced) {
                if (area > dimensions.maxArea) {
                    dimensions = currentDimensions;
                } else if ((area === dimensions.maxArea)
                    && ((oldNumberOfVisibleParticipants > desiredNumberOfVisibleTiles
                            && oldNumberOfVisibleParticipants >= numberOfParticipants)
                        || (oldNumberOfVisibleParticipants < numberOfParticipants
                            && numberOfVisibleParticipants <= desiredNumberOfVisibleTiles))
                ) { // If the area of the new candidates and the old ones are equal we prefer the one that will have
                    // closer number of visible participants to desiredNumberOfVisibleTiles config.
                    dimensions = currentDimensions;
                }
            } else if (minHeightEnforced && area >= minHeightEnforcedDimensions.maxArea) {
                // If we choose configuration with minHeightEnforced there will be less than desiredNumberOfVisibleTiles
                // visible tiles, that's why we prefer more columns when the area is the same.
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
    noHorizontalContainerMargin = false,
    minTileHeight
}: {
    clientHeight: number;
    clientWidth: number;
    columns: number;
    disableResponsiveTiles: boolean;
    disableTileEnlargement?: boolean;
    minTileHeight?: number | null;
    minVisibleRows: number;
    noHorizontalContainerMargin?: boolean;
}) {
    const aspectRatio = getTileDefaultAspectRatio(disableResponsiveTiles, disableTileEnlargement, clientWidth);
    const minHeight = minTileHeight || getThumbnailMinHeight(clientWidth);
    const viewWidth = clientWidth - (columns * TILE_HORIZONTAL_MARGIN)
        - (noHorizontalContainerMargin ? SCROLL_SIZE : TILE_VIEW_GRID_HORIZONTAL_MARGIN);
    const availableHeight = clientHeight - TILE_VIEW_GRID_VERTICAL_MARGIN;
    const viewHeight = availableHeight - (minVisibleRows * TILE_VERTICAL_MARGIN);
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

        const height = Math.min(aspectRatioHeight, initialHeight);

        return {
            height,
            width: aspectRatio * height,
            minHeightEnforced,
            maxVisibleRows: Math.floor(availableHeight / (height + TILE_VERTICAL_MARGIN))
        };
    }

    const initialRatio = initialWidth / initialHeight;
    let height = initialHeight;
    let width;

    // The biggest area of the grid will be when the grid's height is equal to clientHeight or when the grid's width is
    // equal to clientWidth.

    if (initialRatio > aspectRatio) {
        width = initialHeight * aspectRatio;
    } else if (initialRatio >= TILE_PORTRAIT_ASPECT_RATIO) {
        width = initialWidth;
    // eslint-disable-next-line no-negated-condition
    } else if (!minHeightEnforced) {
        height = initialWidth / TILE_PORTRAIT_ASPECT_RATIO;

        if (height >= minHeight) {
            width = initialWidth;
        } else { // The width is so small that we can't reach the minimum height with portrait aspect ratio.
            return;
        }
    } else {
        // We can't fit that number of columns with the desired min height and aspect ratio.
        return;
    }

    return {
        height,
        width,
        minHeightEnforced,
        maxVisibleRows: Math.floor(availableHeight / (height + TILE_VERTICAL_MARGIN))
    };
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
export function computeDisplayModeFromInput(input: any) {
    const {
        filmstripType,
        isActiveParticipant,
        isAudioOnly,
        isCurrentlyOnLargeVideo,
        isVirtualScreenshareParticipant,
        isScreenSharing,
        canPlayEventReceived,
        isRemoteParticipant,
        stageParticipantsVisible,
        tileViewActive
    } = input;
    const adjustedIsVideoPlayable = input.isVideoPlayable && (!isRemoteParticipant || canPlayEventReceived);

    // Display video for virtual screen share participants in all layouts.
    if (isVirtualScreenshareParticipant) {
        return DISPLAY_VIDEO;
    }

    // Multi-stream is not supported on plan-b endpoints even if its is enabled via config.js. A virtual
    // screenshare tile is still created when a remote endpoint starts screenshare to keep the behavior consistent
    // and an avatar is displayed on the original participant thumbnail as long as screenshare is in progress.
    if (isScreenSharing) {
        return DISPLAY_AVATAR;
    }

    if (!tileViewActive && filmstripType === FILMSTRIP_TYPE.MAIN && ((isScreenSharing && isRemoteParticipant)
        || (stageParticipantsVisible && isActiveParticipant))) {
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
export function getDisplayModeInput(props: any, state: { canPlayEventReceived: boolean; }) {
    const {
        _currentLayout,
        _isActiveParticipant,
        _isAudioOnly,
        _isCurrentlyOnLargeVideo,
        _isVirtualScreenshareParticipant,
        _isScreenSharing,
        _isVideoPlayable,
        _participant,
        _stageParticipantsVisible,
        _videoTrack,
        filmstripType = FILMSTRIP_TYPE.MAIN
    } = props;
    const tileViewActive = _currentLayout === LAYOUTS.TILE_VIEW;
    const { canPlayEventReceived } = state;

    return {
        filmstripType,
        isActiveParticipant: _isActiveParticipant,
        isCurrentlyOnLargeVideo: _isCurrentlyOnLargeVideo,
        isAudioOnly: _isAudioOnly,
        tileViewActive,
        isVideoPlayable: _isVideoPlayable,
        canPlayEventReceived,
        videoStream: Boolean(_videoTrack),
        isRemoteParticipant: !_participant?.fakeParticipant && !_participant?.local,
        isScreenSharing: _isScreenSharing,
        isVirtualScreenshareParticipant: _isVirtualScreenshareParticipant,
        stageParticipantsVisible: _stageParticipantsVisible,
        videoStreamMuted: _videoTrack ? _videoTrack.muted : 'no stream'
    };
}

/**
 * Gets the tooltip position for the thumbnail indicators.
 *
 * @param {string} thumbnailType - The current thumbnail type.
 * @returns {string}
 */
export function getIndicatorsTooltipPosition(thumbnailType?: string) {
    return INDICATORS_TOOLTIP_POSITION[thumbnailType ?? ''] || 'top';
}

/**
 * Returns whether or not the filmstrip is resizable.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function isFilmstripResizable(state: IReduxState) {
    const { filmstrip } = state['features/base/config'];
    const _currentLayout = getCurrentLayout(state);

    return !filmstrip?.disableResizable && !isMobileBrowser()
        && (_currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW || _currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW);
}

/**
 * Whether or not grid should be displayed in the vertical filmstrip.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function showGridInVerticalView(state: IReduxState) {
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
export function getVerticalViewMaxWidth(state: IReduxState) {
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
 * Returns true if the scroll is displayed and false otherwise.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} - True if the scroll is displayed and false otherwise.
 */
export function isFilmstripScrollVisible(state: IReduxState) {
    const _currentLayout = getCurrentLayout(state);
    let hasScroll = false;

    switch (_currentLayout) {
    case LAYOUTS.TILE_VIEW:
        ({ hasScroll = false } = state['features/filmstrip'].tileViewDimensions ?? {});
        break;
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
    case LAYOUTS.STAGE_FILMSTRIP_VIEW: {
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
export function getActiveParticipantsIds(state: IReduxState) {
    const { activeParticipants } = state['features/filmstrip'];

    return activeParticipants.map(p => p.participantId);
}

/**
 * Gets the ids of the active participants.
 *
 * @param {Object} state - Redux state.
 * @returns {Array<Object>}
 */
export function getPinnedActiveParticipants(state: IReduxState) {
    const { activeParticipants } = state['features/filmstrip'];

    return activeParticipants.filter(p => p.pinned);
}

/**
 * Get whether or not the stage filmstrip is available (enabled & can be used).
 *
 * @param {Object} state - Redux state.
 * @param {number} minParticipantCount - The min number of participants for the stage filmstrip
 * to be displayed.
 * @returns {boolean}
 */
export function isStageFilmstripAvailable(state: IReduxState, minParticipantCount = 0) {
    const { activeParticipants } = state['features/filmstrip'];
    const { remoteScreenShares } = state['features/video-layout'];
    const sharedVideo = isSharingStatus(state['features/shared-video']?.status ?? '');

    return isStageFilmstripEnabled(state) && !sharedVideo
        && activeParticipants.length >= minParticipantCount
        && (isTopPanelEnabled(state) || remoteScreenShares.length === 0);
}

/**
 * Whether the stage filmstrip should be displayed on the top.
 *
 * @param {Object} state - Redux state.
 * @param {number} minParticipantCount - The min number of participants for the stage filmstrip
 * to be displayed.
 * @returns {boolean}
 */
export function isStageFilmstripTopPanel(state: IReduxState, minParticipantCount = 0) {
    const { remoteScreenShares } = state['features/video-layout'];

    return isTopPanelEnabled(state)
        && isStageFilmstripAvailable(state, minParticipantCount) && remoteScreenShares.length > 0;
}

/**
 * Whether the stage filmstrip is disabled or not.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function isStageFilmstripEnabled(state: IReduxState) {
    const { filmstrip } = state['features/base/config'];

    return Boolean(!filmstrip?.disableStageFilmstrip && interfaceConfig.VERTICAL_FILMSTRIP);
}

/**
 * Whether the vertical/horizontal filmstrip is disabled.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function isFilmstripDisabled(state: IReduxState) {
    const { filmstrip } = state['features/base/config'];

    return Boolean(filmstrip?.disabled);
}

/**
 * Gets the thumbnail type by filmstrip type.
 *
 * @param {string} currentLayout - Current app layout.
 * @param {string} filmstripType - The current filmstrip type.
 * @returns {string}
 */
export function getThumbnailTypeFromLayout(currentLayout: string, filmstripType: string) {
    switch (currentLayout) {
    case LAYOUTS.TILE_VIEW:
        return THUMBNAIL_TYPE.TILE;
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
        return THUMBNAIL_TYPE.VERTICAL;
    case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
        return THUMBNAIL_TYPE.HORIZONTAL;
    case LAYOUTS.STAGE_FILMSTRIP_VIEW:
        if (filmstripType !== FILMSTRIP_TYPE.MAIN) {
            return THUMBNAIL_TYPE.TILE;
        }

        return THUMBNAIL_TYPE.VERTICAL;
    }
}

/**
 * Returns the id of the participant displayed on the screen share filmstrip.
 *
 * @param {Object} state - Redux state.
 * @returns {string} - The participant id.
 */
export function getScreenshareFilmstripParticipantId(state: IReduxState) {
    const { screenshareFilmstripParticipantId } = state['features/filmstrip'];
    const screenshares = state['features/video-layout'].remoteScreenShares;
    let id = screenshares.find(sId => sId === screenshareFilmstripParticipantId);

    if (!id && screenshares.length) {
        id = screenshares[0];
    }

    return id;
}

/**
 * Whether or not the top panel is enabled.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function isTopPanelEnabled(state: IReduxState) {
    const { filmstrip } = state['features/base/config'];
    const participantsCount = getParticipantCount(state);

    return !filmstrip?.disableTopPanel && participantsCount >= (filmstrip?.minParticipantCountForTopPanel ?? 50);

}
