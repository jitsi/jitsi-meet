import { SET_CREATE_ROOM_ERROR, SET_JOIN_ROOM_ERROR } from "./actionTypes";

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
