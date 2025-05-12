import ReducerRegistry from "../../../../redux/ReducerRegistry";
import { SET_CREATE_ROOM_ERROR, SET_JOIN_ROOM_ERROR, SET_ROOM_ID } from "./actionTypes";

export const initialState: IJoinRoomErrorState = {
    joinRoomError: false,
    joinRoomErrorMessage: "",
    createRoomError: false,
    createRoomErrorMessage: "",
    roomID: null,
};

export interface IJoinRoomErrorState {
    joinRoomError: boolean;
    joinRoomErrorMessage: string;
    createRoomError: boolean;
    createRoomErrorMessage: string;
    roomID: string | null;
}

export const meetRoomReducer = (state: IJoinRoomErrorState = initialState, action: any): IJoinRoomErrorState => {
    switch (action.type) {
        case SET_JOIN_ROOM_ERROR:
            return {
                ...state,
                joinRoomError: action.joinRoomError,
                joinRoomErrorMessage: action.message,
            };
        case SET_CREATE_ROOM_ERROR:
            return {
                ...state,
                createRoomError: action.createRoomError,
                createRoomErrorMessage: action.message,
            };
        case SET_ROOM_ID:
            return {
                ...state,
                roomID: action.roomID,
            };
        default:
            return state;
    }
};


ReducerRegistry.register("features/meet-room", meetRoomReducer);
