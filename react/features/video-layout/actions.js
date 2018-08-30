// @flow

import { SET_TILE_VIEW } from './actionTypes';

/**
 * Creates a (redux) action which signals to set the UI layout to be tiled view
 * or not.
 *
 * @param {boolean} enabled - Whether or not tile view should be shown.
 * @returns {{
 *     type: SET_TILE_VIEW,
 *     enabled: boolean
 * }}
 */
export function setTileView(enabled: boolean) {
    return {
        type: SET_TILE_VIEW,
        enabled
    };
}
