// @flow
import type { Dispatch } from 'redux';

import { getFeatureFlag, TILE_VIEW_ENABLED } from '../base/flags';
import {
    getPinnedParticipant,
    getParticipantCount,
    pinParticipant
} from '../base/participants';
import {
    ASPECT_RATIO_BREAKPOINT,
    DEFAULT_MAX_COLUMNS,
    ABSOLUTE_MAX_COLUMNS,
    SINGLE_COLUMN_BREAKPOINT,
    TWO_COLUMN_BREAKPOINT
} from '../filmstrip/constants';
import { isVideoPlaying } from '../shared-video/functions';

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
 * @returns {number}
 */
export function getMaxColumnCount(state: Object) {
    const configuredMax = interfaceConfig.TILE_VIEW_MAX_COLUMNS || DEFAULT_MAX_COLUMNS;
    const { disableResponsiveTiles } = state['features/base/config'];

    if (!disableResponsiveTiles) {
        const { clientWidth } = state['features/base/responsive-ui'];
        const participantCount = getParticipantCount(state);

        // If there are just two participants in a conference, enforce single-column view for mobile size.
        if (participantCount === 2 && clientWidth < ASPECT_RATIO_BREAKPOINT) {
            return Math.min(1, Math.max(configuredMax, 1));
        }

        // Enforce single column view at very small screen widths.
        if (clientWidth < SINGLE_COLUMN_BREAKPOINT) {
            return Math.min(1, Math.max(configuredMax, 1));
        }

        // Enforce two column view below breakpoint.
        if (clientWidth < TWO_COLUMN_BREAKPOINT) {
            return Math.min(2, Math.max(configuredMax, 1));
        }
    }

    return Math.min(Math.max(configuredMax, 1), ABSOLUTE_MAX_COLUMNS);
}

/**
 * Returns the cell count dimensions for tile view. Tile view tries to uphold
 * equal count of tiles for height and width, until maxColumn is reached in
 * which rows will be added but no more columns.
 *
 * @param {Object} state - The redux store state.
 * @returns {Object} An object is return with the desired number of columns,
 * rows, and visible rows (the rest should overflow) for the tile view layout.
 */
export function getTileViewGridDimensions(state: Object) {
    const maxColumns = getMaxColumnCount(state);

    // When in tile view mode, we must discount ourselves (the local participant) because our
    // tile is not visible.
    const { iAmRecorder } = state['features/base/config'];
    const numberOfParticipants = state['features/base/participants'].length - (iAmRecorder ? 1 : 0);

    const columnsToMaintainASquare = Math.ceil(Math.sqrt(numberOfParticipants));
    const columns = Math.min(columnsToMaintainASquare, maxColumns);
    const rows = Math.ceil(numberOfParticipants / columns);
    const visibleRows = Math.min(maxColumns, rows);

    return {
        columns,
        visibleRows
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
