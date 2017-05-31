/* @flow */

import { getInviteURL } from '../base/connection';

import { BEGIN_SHARE_ROOM, END_SHARE_ROOM } from './actionTypes';

/**
 * Begins the UI procedure to share the URL for the current conference/room.
 *
 * @param {string} roomURL - The URL of the room to share.
 * @public
 * @returns {Function}
 */
export function beginShareRoom(roomURL: ?string): Function {
    return (dispatch, getState) => {
        if (!roomURL) {
            // eslint-disable-next-line no-param-reassign
            roomURL = getInviteURL(getState);
        }
        roomURL && dispatch({
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
export function endShareRoom(roomURL: string, shared: boolean): Object {
    return {
        type: END_SHARE_ROOM,
        roomURL,
        shared
    };
}
