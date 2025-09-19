import { SET_CREATE_ROOM_ERROR, SET_JOIN_ROOM_ERROR, SET_ROOM_ID } from "./actionTypes";

/**
 * Action to set the join room error state.
 *
 * @param {boolean} joinRoomError - The value indicating if there is an error joining the room.
 * @param {string} message - The error message when there is an error joining the room.
 * @returns {{
 *     type: typeof SET_JOIN_ROOM_ERROR,
 *     joinRoomError: boolean,
 *     message: string
 * }}
 */
export const setJoinRoomError = (joinRoomError: boolean, message = "") => {
    return {
        type: SET_JOIN_ROOM_ERROR,
        joinRoomError,
        message,
    };
};

/**
 * Action to set the create room error state.
 *
 * @param {boolean} createRoomError - The value indicating if there is an error creating the room.
 * @param {string} message - The error message when there is an error creating the room.
 * @returns {{
 *     type: typeof SET_CREATE_ROOM_ERROR,
 *     createRoomError: boolean,
 *     message: string
 * }}
 */
export const setCreateRoomError = (createRoomError: boolean, message = "") => {
    return {
        type: SET_CREATE_ROOM_ERROR,
        createRoomError,
        message,
    };
};

/**
 * Action to set the room ID.
 *
 * @param {string | null} roomID - The ID of the created room or null if no room.
 * @returns {{
 *     type: typeof SET_ROOM_ID,
 *     roomID: string | null
 * }}
 */
export const setRoomID = (roomID: string | null) => {
    return {
        type: SET_ROOM_ID,
        roomID,
    };
};
