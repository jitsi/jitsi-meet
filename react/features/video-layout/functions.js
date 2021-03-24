// @flow

import { getFeatureFlag, TILE_VIEW_ENABLED } from '../base/flags';
import { getPinnedParticipant, getParticipantCount } from '../base/participants';
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
 * @param {number} maxColumns - The maximum number of columns that can be
 * displayed.
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
