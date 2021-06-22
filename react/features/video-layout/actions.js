// @flow

import type { Dispatch } from 'redux';

import {
    SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED,
    SELECT_ENDPOINTS,
    SET_TILE_VIEW
} from './actionTypes';
import { shouldDisplayTileView } from './functions';

/**
 * Creates a (redux) action which signals that a new set of remote endpoints need to be selected.
 *
 * @param {Array<string>} participantIds - The remote participants that are currently selected
 * for video forwarding from the bridge.
 * @returns {{
 *      type: SELECT_ENDPOINTS,
 *      particpantsIds: Array<string>
 * }}
 */
export function selectEndpoints(participantIds: Array<string>) {
    return {
        type: SELECT_ENDPOINTS,
        participantIds
    };
}

/**
 * Creates a (redux) action which signals that the list of known remote participants
 * with screen shares has changed.
 *
 * @param {string} participantIds - The remote participants which currently have active
 * screen share streams.
 * @returns {{
 *     type: SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED,
 *     participantId: string
 * }}
 */
export function setRemoteParticipantsWithScreenShare(participantIds: Array<string>) {
    return {
        type: SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED,
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
 *     enabled: ?boolean
 * }}
 */
export function setTileView(enabled: ?boolean) {
    return {
        type: SET_TILE_VIEW,
        enabled
    };
}

/**
 * Creates a (redux) action which signals either to exit tile view if currently
 * enabled or enter tile view if currently disabled.
 *
 * @returns {Function}
 */
export function toggleTileView() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const tileViewActive = shouldDisplayTileView(getState());

        dispatch(setTileView(!tileViewActive));
    };
}
