// @flow
import type { Dispatch } from 'redux';

import { getFeatureFlag, TILE_VIEW_ENABLED } from '../base/flags';
import {
    getPinnedParticipant,
    getParticipantCount,
    pinParticipant
} from '../base/participants';
import {
    DEFAULT_MAX_COLUMNS,
    ABSOLUTE_MAX_COLUMNS
} from '../filmstrip/constants';
import { getNumberOfPartipantsForTileView } from '../filmstrip/functions.web';
import { isVideoPlaying } from '../shared-video/functions';
import { VIDEO_QUALITY_LEVELS } from '../video-quality/constants';

import { LAYOUTS } from './constants';

declare var interfaceConfig: Object;

/**
 * A selector for retrieving the current automatic pinning setting.
 *
 * @private
 * @returns {string|undefined} The string "remote-only" is returned if only
 * remote screen sharing should be automatically pinned, any other truthy value
 * means automatically pin all screen shares. Falsy means do not automatically
 * pin any screen shares.
 */
export function getAutoPinSetting() {
    return typeof interfaceConfig === 'object'
        ? interfaceConfig.AUTO_PIN_LATEST_SCREEN_SHARE
        : 'remote-only';
}

/**
 * Returns the {@code LAYOUTS} constant associated with the layout
 * the application should currently be in.
 *
 * @param {Object} state - The redux state.
 * @returns {string}
 */
export function getCurrentLayout(state: Object) {
    if (shouldDisplayTileView(state)) {
        return LAYOUTS.TILE_VIEW;
    } else if (interfaceConfig.VERTICAL_FILMSTRIP) {
        return LAYOUTS.VERTICAL_FILMSTRIP_VIEW;
    }

    return LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW;
}

/**
 * Returns how many columns should be displayed in tile view. The number
 * returned will be between 1 and 7, inclusive.
 *
 * @param {Object} state - The redux store state.
 * @param {number} width - Custom width to use for calculation.
 * @returns {number}
 */
export function getMaxColumnCount() {
    const configuredMax = (typeof interfaceConfig === 'undefined'
        ? DEFAULT_MAX_COLUMNS
        : interfaceConfig.TILE_VIEW_MAX_COLUMNS) || DEFAULT_MAX_COLUMNS;

    return Math.min(Math.max(configuredMax, 1), ABSOLUTE_MAX_COLUMNS);
}

/**
 * Returns the cell count dimensions for tile view. Tile view tries to uphold
 * equal count of tiles for height and width, until maxColumn is reached in
 * which rows will be added but no more columns.
 *
 * @param {Object} state - The redux store state.
 * @param {boolean} stageFilmstrip - Whether the dimensions should be calculated for the stage filmstrip.
 * @returns {Object} An object is return with the desired number of columns,
 * rows, and visible rows (the rest should overflow) for the tile view layout.
 */
export function getNotResponsiveTileViewGridDimensions(state: Object, stageFilmstrip: boolean = false) {
    const maxColumns = getMaxColumnCount(state);
    const { activeParticipants } = state['features/filmstrip'];
    const numberOfParticipants = stageFilmstrip ? activeParticipants.length : getNumberOfPartipantsForTileView(state);
    const columnsToMaintainASquare = Math.ceil(Math.sqrt(numberOfParticipants));
    const columns = Math.min(columnsToMaintainASquare, maxColumns);
    const rows = Math.ceil(numberOfParticipants / columns);
    const minVisibleRows = Math.min(maxColumns, rows);

    return {
        columns,
        minVisibleRows,
        rows
    };
}

/**
 * Selector for determining if the UI layout should be in tile view. Tile view
 * is determined by more than just having the tile view setting enabled, as
 * one-on-one calls should not be in tile view, as well as etherpad editing.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} True if tile view should be displayed.
 */
export function shouldDisplayTileView(state: Object = {}) {
    const participantCount = getParticipantCount(state);

    const tileViewEnabledFeatureFlag = getFeatureFlag(state, TILE_VIEW_ENABLED, true);
    const { disableTileView } = state['features/base/config'];

    if (disableTileView || !tileViewEnabledFeatureFlag) {
        return false;
    }

    const { tileViewEnabled } = state['features/video-layout'];

    if (tileViewEnabled !== undefined) {
        // If the user explicitly requested a view mode, we
        // do that.
        return tileViewEnabled;
    }

    const { iAmRecorder } = state['features/base/config'];

    // None tile view mode is easier to calculate (no need for many negations), so we do
    // that and negate it only once.
    const shouldDisplayNormalMode = Boolean(

        // Reasons for normal mode:

        // Editing etherpad
        state['features/etherpad']?.editing

        // We pinned a participant
        || getPinnedParticipant(state)

        // It's a 1-on-1 meeting
        || participantCount < 3

        // There is a shared YouTube video in the meeting
        || isVideoPlaying(state)

        // We want jibri to use stage view by default
        || iAmRecorder
    );

    return !shouldDisplayNormalMode;
}

/**
 * Private helper to automatically pin the latest screen share stream or unpin
 * if there are no more screen share streams.
 *
 * @param {Array<string>} screenShares - Array containing the list of all the screen sharing endpoints
 * before the update was triggered (including the ones that have been removed from redux because of the update).
 * @param {Store} store - The redux store.
 * @returns {void}
 */
export function updateAutoPinnedParticipant(
        screenShares: Array<string>, { dispatch, getState }: { dispatch: Dispatch<any>, getState: Function }) {
    const state = getState();
    const remoteScreenShares = state['features/video-layout'].remoteScreenShares;
    const pinned = getPinnedParticipant(getState);

    // if the pinned participant is shared video or some other fake participant we want to skip auto-pinning
    if (pinned?.isFakeParticipant) {
        return;
    }

    // Unpin the screen share when the screen sharing participant leaves. Switch to tile view if no other
    // participant was pinned before screen share was auto-pinned, pin the previously pinned participant otherwise.
    if (!remoteScreenShares?.length) {
        let participantId = null;

        if (pinned && !screenShares.find(share => share === pinned.id)) {
            participantId = pinned.id;
        }
        dispatch(pinParticipant(participantId));

        return;
    }

    const latestScreenShareParticipantId = remoteScreenShares[remoteScreenShares.length - 1];

    if (latestScreenShareParticipantId) {
        dispatch(pinParticipant(latestScreenShareParticipantId));
    }
}

/**
 * Selector for whether we are currently in tile view.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isLayoutTileView(state: Object) {
    return getCurrentLayout(state) === LAYOUTS.TILE_VIEW;
}

/**
 * Gets the video quality for the given height.
 *
 * @param {number|undefined} height - Height of the video container.
 * @returns {number}
 */
function getVideoQualityForHeight(height: number) {
    if (!height) {
        return VIDEO_QUALITY_LEVELS.LOW;
    }
    const levels = Object.values(VIDEO_QUALITY_LEVELS)
        .map(Number)
        .sort((a, b) => a - b);

    for (const level of levels) {
        if (height <= level) {
            return level;
        }
    }

    return VIDEO_QUALITY_LEVELS.ULTRA;
}

/**
 * Gets the video quality level for the resizable filmstrip thumbnail height.
 *
 * @param {Object} state - Redux state.
 * @returns {number}
 */
export function getVideoQualityForResizableFilmstripThumbnails(state) {
    const height = state['features/filmstrip'].verticalViewDimensions?.gridView?.thumbnailSize?.height;

    return getVideoQualityForHeight(height);
}

/**
 * Gets the video quality for the large video.
 *
 * @returns {number}
 */
export function getVideoQualityForLargeVideo() {
    const wrapper = document.querySelector('#largeVideoWrapper');

    return getVideoQualityForHeight(wrapper.clientHeight);
}

/**
 * Gets the video quality level for the thumbnails in the stage filmstrip.
 *
 * @param {Object} state - Redux state.
 * @returns {number}
 */
export function getVideoQualityForStageThumbnails(state) {
    const height = state['features/filmstrip'].stageFilmstripDimensions?.thumbnailSize?.height;

    return getVideoQualityForHeight(height);
}
