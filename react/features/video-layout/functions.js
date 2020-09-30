// @flow

import { getPinnedParticipant, getParticipantCount } from '../base/participants';
import { isYoutubeVideoPlaying } from '../youtube-player/functions';

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
 * Returns the limit on how many columns should be displayed in tile view.
 * The number returned will be between 1 and 5, inclusive.
 *
 * @returns {number}
 */
export function getMaxColumnCount() {
    const configuredMax = interfaceConfig.TILE_VIEW_MAX_COLUMNS || 5;

    return Math.min(Math.max(configuredMax, 1), 5);
}

/**
 * Returns the limit on how many rows should be displayed in tile view.
 * The number returned will be between 1 and 5, inclusive.
 *
 * @returns {number}
 */
export function getMaxRowCount() {
    const configuredMax = interfaceConfig.TILE_VIEW_MAX_ROWS || 5;

    return Math.min(Math.max(configuredMax, 1), 5);
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

    // In case of a lonely meeting, we don't allow tile view.
    // But it's a special case too, as we don't even render the button,
    // see TileViewButton component.
    if (participantCount < 2) {
        return false;
    }

    const { tileViewEnabled } = state['features/video-layout'];

    if (tileViewEnabled !== undefined) {
        // If the user explicitly requested a view mode, we
        // do that.
        return tileViewEnabled;
    }

    // None tile view mode is easier to calculate (no need for many negations), so we do
    // that and negate it only once.
    const shouldDisplayNormalMode = Boolean(

        // Reasons for normal mode:

        // Editing etherpad
        state['features/etherpad']?.editing

        // We're in filmstrip-only mode
        || (typeof interfaceConfig === 'object' && interfaceConfig?.filmStripOnly)

        // We pinned a participant
        || getPinnedParticipant(state)

        // It's a 1-on-1 meeting
        || participantCount < 3

        // There is a shared YouTube video in the meeting
        || isYoutubeVideoPlaying(state)
    );

    return !shouldDisplayNormalMode;
}
