import { IStore } from '../app/types';
import { getInviteURL } from '../base/connection/functions';

import {
    BEGIN_SHARE_ROOM,
    END_SHARE_ROOM,
    TOGGLE_SHARE_DIALOG
} from './actionTypes';

/**
 * Begins the UI procedure to share the URL for the current conference/room.
 *
 * @param {string} roomURL - The URL of the room to share.
 * @public
 * @returns {Function}
 */
export function beginShareRoom(roomURL?: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!roomURL) {
            // eslint-disable-next-line no-param-reassign
            roomURL = getInviteURL(getState);
        }

        dispatch({
            type: BEGIN_SHARE_ROOM,
            roomURL
        });
    };
}

/**
 * Ends the UI procedure to share a specific conference/room URL.
 *
 * @param {string} roomURL - The URL of the conference/room which was shared.
 * @param {boolean} shared - True if the URL was shared successfully; false,
 * otherwise.
 * @public
 * @returns {{
 *     type: END_SHARE_ROOM,
 *     roomURL: string,
 *     shared: boolean
 * }}
 */
export function endShareRoom(roomURL: string, shared: boolean) {
    return {
        type: END_SHARE_ROOM,
        roomURL,
        shared
    };
}


/**
 * UI procedure for sharing conference room URL inside a dialog.
 *
 * @param {boolean} visible - True if share dialog is visible; false,
 * otherwise.
 * @public
 * @returns {{
 *     type: TOGGLE_SHARE_DIALOG,
 *     visible: boolean
 * }}
 */
export function toggleShareDialog(visible: boolean) {
    return {
        type: TOGGLE_SHARE_DIALOG,
        visible
    };
}
