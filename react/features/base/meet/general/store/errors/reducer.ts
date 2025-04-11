import ReducerRegistry from "../../../../redux/ReducerRegistry";
import { SET_CREATE_ROOM_ERROR, SET_JOIN_ROOM_ERROR, SET_ROOM_ID } from "./actionTypes";

const initialState: IJoinRoomErrorState = {
    joinRoomError: false,
    createRoomError: false,
    roomID: null,
};

export interface IJoinRoomErrorState {
    joinRoomError: boolean;
    createRoomError: boolean;
    roomID: string | null;
}

ReducerRegistry.register("features/meet-room", (state: IJoinRoomErrorState = initialState, action) => {
    switch (action.type) {
        case SET_JOIN_ROOM_ERROR:
            return {
                ...state,
                joinRoomError: action.joinRoomError,
            };
        case SET_CREATE_ROOM_ERROR:
            return {
                ...state,
                createRoomError: action.createRoomError,
            };
        case SET_ROOM_ID:
            return {
                ...state,
                roomID: action.roomID,
            };
        default:
            return state;
    }
});
