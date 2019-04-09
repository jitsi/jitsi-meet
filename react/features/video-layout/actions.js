// @flow

import {
    SCREEN_SHARE_PARTICIPANTS_UPDATED,
    SET_TILE_VIEW
} from './actionTypes';

/**
 * Creates a (redux) action which signals that the list of known participants
 * with screen shares has changed.
 *
 * @param {string} participantIds - The participants which currently have active
 * screen share streams.
 * @returns {{
 *     type: SCREEN_SHARE_PARTICIPANTS_UPDATED,
 *     participantId: string
 * }}
 */
export function setParticipantsWithScreenShare(participantIds: Array<string>) {
    return {
        type: SCREEN_SHARE_PARTICIPANTS_UPDATED,
        participantIds
    };
}

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
