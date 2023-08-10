import { IStore } from '../app/types';
import { isTileViewModeDisabled } from '../filmstrip/functions.any';

import {
    SET_TILE_VIEW,
    VIRTUAL_SCREENSHARE_REMOTE_PARTICIPANTS_UPDATED
} from './actionTypes';
import { shouldDisplayTileView } from './functions';

/**
 * Creates a (redux) action which signals that the list of known remote virtual screen share participant ids has
 * changed.
 *
 * @param {string} participantIds - The remote virtual screen share participants.
 * @returns {{
 *     type: VIRTUAL_SCREENSHARE_REMOTE_PARTICIPANTS_UPDATED,
 *     participantIds: Array<string>
 * }}
 */
export function virtualScreenshareParticipantsUpdated(participantIds: Array<string>) {
    return {
        type: VIRTUAL_SCREENSHARE_REMOTE_PARTICIPANTS_UPDATED,
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
export function setTileView(enabled?: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const tileViewDisabled = isTileViewModeDisabled(getState());

        !tileViewDisabled && dispatch({
            type: SET_TILE_VIEW,
            enabled
        });
    };
}

/**
 * Creates a (redux) action which signals either to exit tile view if currently
 * enabled or enter tile view if currently disabled.
 *
 * @returns {Function}
 */
export function toggleTileView() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const tileViewActive = shouldDisplayTileView(getState());

        dispatch(setTileView(!tileViewActive));
    };
}
