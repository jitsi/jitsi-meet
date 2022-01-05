// @flow

import { JitsiParticipantConnectionStatus } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantCountWithFake,
    getPinnedParticipant
} from '../base/participants';
import { toState } from '../base/redux';
import {
    getLocalVideoTrack,
    getTrackByMediaTypeAndParticipant,
    isLocalTrackMuted,
    isRemoteTrackMuted
} from '../base/tracks/functions';
import { LAYOUTS } from '../video-layout';

import {
    ASPECT_RATIO_BREAKPOINT,
    DISPLAY_AVATAR,
    DISPLAY_VIDEO,
    INDICATORS_TOOLTIP_POSITION,
    SCROLL_SIZE,
    SQUARE_TILE_ASPECT_RATIO,
    STAGE_VIEW_THUMBNAIL_HORIZONTAL_BORDER,
    TILE_ASPECT_RATIO,
    TILE_HORIZONTAL_MARGIN,
    TILE_VERTICAL_MARGIN,
    TILE_VIEW_GRID_HORIZONTAL_MARGIN,
    TILE_VIEW_GRID_VERTICAL_MARGIN,
    VERTICAL_FILMSTRIP_MIN_HORIZONTAL_MARGIN,
    TILE_MIN_HEIGHT_LARGE,
    TILE_MIN_HEIGHT_SMALL,
    TILE_PORTRAIT_ASPECT_RATIO
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
    const { connectionStatus } = participant || {};
    const videoTrack
        = isLocal ? getLocalVideoTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, id);
    const isAudioOnly = Boolean(state['features/base/audio-only'].enabled);
    let isPlayable = false;

    if (isLocal) {
        const isVideoMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO);

        isPlayable = Boolean(videoTrack) && !isVideoMuted && !isAudioOnly;
    } else if (!participant?.isFakeParticipant) { // remote participants excluding shared video
        const isVideoMuted = isRemoteTrackMuted(tracks, MEDIA_TYPE.VIDEO, id);

        isPlayable = Boolean(videoTrack) && !isVideoMuted && !isAudioOnly
            && connectionStatus === JitsiParticipantConnectionStatus.ACTIVE;
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
    const availableHeight = Math.min(clientHeight, (interfaceConfig.FILM_STRIP_MAX_HEIGHT || 120) + topBottomMargin);
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
 * @returns {{local: {height, width}, remote: {height, width}}}
 */
export function calculateThumbnailSizeForVerticalView(clientWidth: number = 0) {
    const horizontalMargin
        = VERTICAL_FILMSTRIP_MIN_HORIZONTAL_MARGIN + SCROLL_SIZE
            + TILE_HORIZONTAL_MARGIN + STAGE_VIEW_THUMBNAIL_HORIZONTAL_BORDER;
    const availableWidth = Math.min(
        Math.max(clientWidth - horizontalMargin, 0),
        interfaceConfig.FILM_STRIP_MAX_HEIGHT || 120);

    return {
        local: {
            height: Math.floor(availableWidth / interfaceConfig.LOCAL_THUMBNAIL_RATIO),
            width: availableWidth
        },
        remote: {
            height: Math.floor(availableWidth / interfaceConfig.REMOTE_THUMBNAIL_RATIO),
            width: availableWidth
        }
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
    rows,
    clientWidth,
    clientHeight,
    disableResponsiveTiles,
    disableTileEnlargement
}: Object) {
    let aspectRatio = TILE_ASPECT_RATIO;

    if (!disableResponsiveTiles && clientWidth < ASPECT_RATIO_BREAKPOINT) {
        aspectRatio = SQUARE_TILE_ASPECT_RATIO;
    }

    const minHeight = clientWidth < ASPECT_RATIO_BREAKPOINT ? TILE_MIN_HEIGHT_SMALL : TILE_MIN_HEIGHT_LARGE;
    const viewWidth = clientWidth - (columns * TILE_HORIZONTAL_MARGIN) - TILE_VIEW_GRID_HORIZONTAL_MARGIN;
    const viewHeight = clientHeight - (minVisibleRows * TILE_VERTICAL_MARGIN) - TILE_VIEW_GRID_VERTICAL_MARGIN;
    const initialWidth = viewWidth / columns;
    const initialHeight = viewHeight / minVisibleRows;
    const aspectRatioHeight = initialWidth / aspectRatio;
    const noScrollHeight = (clientHeight / rows) - TILE_VERTICAL_MARGIN;
    const scrollInitialWidth = (viewWidth - SCROLL_SIZE) / columns;
    let height = Math.floor(Math.min(aspectRatioHeight, initialHeight));
    let width = Math.floor(aspectRatio * height);

    if (height > noScrollHeight && width > scrollInitialWidth) { // we will have scroll and we need more space for it.
        const scrollAspectRatioHeight = scrollInitialWidth / aspectRatio;

        // Recalculating width/height to fit the available space when a scroll is displayed.
        // NOTE: Math.min(scrollAspectRatioHeight, initialHeight) would be enough to recalculate but since the new
        // height value can theoretically be dramatically smaller and the scroll may not be neccessary anymore we need
        // to compare it with noScrollHeight( the optimal height to fit all thumbnails without scroll) and get the
        // bigger one. This way we ensure that we always strech the thumbnails as close as we can to the edges of the
        // window.
        height = Math.floor(Math.max(Math.min(scrollAspectRatioHeight, initialHeight), noScrollHeight));
        width = Math.floor(aspectRatio * height);

        return {
            height,
            width
        };
    }

    if (disableTileEnlargement) {
        return {
            height,
            width
        };
    }

    if (initialHeight > noScrollHeight) {
        height = Math.max(height, viewHeight / rows, minHeight);
        width = Math.max(width, initialWidth);
    } else {
        height = Math.max(initialHeight, minHeight);
        width = initialWidth;
    }

    if (height > width) {
        const heightFromWidth = TILE_PORTRAIT_ASPECT_RATIO * width;

        if (height > heightFromWidth && heightFromWidth < minHeight) {
            return {
                height,
                width: height / TILE_PORTRAIT_ASPECT_RATIO
            };
        }

        return {
            height: Math.min(height, heightFromWidth),
            width
        };
    } else if (height < width) {
        return {
            height,
            width: Math.min(width, aspectRatio * height)
        };
    }

    return {
        height,
        width
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
    const filmstripMaxWidth = (interfaceConfig.FILM_STRIP_MAX_HEIGHT || 120) + 18;

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
        isAudioOnly,
        isCurrentlyOnLargeVideo,
        isScreenSharing,
        canPlayEventReceived,
        isRemoteParticipant,
        tileViewActive
    } = input;
    const adjustedIsVideoPlayable = input.isVideoPlayable && (!isRemoteParticipant || canPlayEventReceived);

    if (!tileViewActive && isScreenSharing && isRemoteParticipant) {
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
