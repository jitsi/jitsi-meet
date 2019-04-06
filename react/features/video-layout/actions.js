// @flow

import {
    SCREEN_SHARE_STREAM_ADDED,
    SCREEN_SHARE_STREAM_REMOVED,
    SET_TILE_VIEW
} from './actionTypes';

/**
 * Creates a (redux) action which signals that a screen share stream has been
 * started by a participant.
 *
 * @param {string} participantId - The participant associated with the started
 * screen share stream.
 * @returns {{
 *     type: SCREEN_SHARE_STREAM_ADDED,
 *     participantId: string
 * }}
 */
export function screenShareStreamAdded(participantId: string) {
    return {
        type: SCREEN_SHARE_STREAM_ADDED,
        participantId
    };
}

/**
 * Creates a (redux) action which signals that a screen share stream has been
 * stopped.
 *
 * @param {string} participantId - The participant associated with the stopped
 * screen share stream.
 * @returns {{
 *     type: SCREEN_SHARE_STREAM_REMOVED,
 *     participantId: string
 * }}
 */
export function screenShareStreamRemoved(participantId: string) {
    return {
        type: SCREEN_SHARE_STREAM_REMOVED,
        participantId
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
