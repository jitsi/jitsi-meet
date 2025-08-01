import { SET_CREATE_ROOM_ERROR, SET_JOIN_ROOM_ERROR, SET_ROOM_ID } from "./actionTypes";

/**
 * Action to set the join room error state.
 *
 * @param {boolean} joinRoomError - The value indicating if there is an error joining the room.
 * @returns {{
 *     type: SET_JOIN_ROOM_ERROR,
 *     joinRoomError: boolean
 * }}
 */
export const setJoinRoomError = (joinRoomError: boolean) => {
    return {
        type: SET_JOIN_ROOM_ERROR,
        joinRoomError,
    };
};

/**
 * Action to set the create room error state.
 *
 * @param {boolean} createRoomError - The value indicating if there is an error creating the room.
 * @returns {{
 *     type: SET_CREATE_ROOM_ERROR,
 *     createRoomError: boolean
 * }}
 */
export const setCreateRoomError = (createRoomError: boolean) => {
    return {
        type: SET_CREATE_ROOM_ERROR,
        createRoomError,
    };
};

/**
 * Action to set the room ID.
 *
 * @param {string | null} roomID - The value indicating the ID of the created room.
 * @returns {{
*     type: SET_ROOM_ID,
*     roomID: string
* }}
*/
export const setRoomID = (roomID: string | null) => {
   return {
       type: SET_ROOM_ID,
       roomID,
   };
};
