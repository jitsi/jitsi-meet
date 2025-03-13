import ReducerRegistry from "../../../../redux/ReducerRegistry";
import { SET_CREATE_ROOM_ERROR, SET_JOIN_ROOM_ERROR } from "./actionTypes";

const initialState: IJoinRoomErrorState = {
    joinRoomError: false,
    createRoomError: false,
};

export interface IJoinRoomErrorState {
    joinRoomError: boolean;
    createRoomError: boolean;
}

ReducerRegistry.register("features/join-room-error", (state: IJoinRoomErrorState = initialState, action) => {
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
        default:
            return state;
    }
});
