import { describe, expect, it } from "vitest";
import { SET_CREATE_ROOM_ERROR, SET_JOIN_ROOM_ERROR, SET_ROOM_ID } from "../actionTypes";
import { setCreateRoomError, setJoinRoomError, setRoomID } from "../actions";
import { initialState, meetRoomReducer } from "../reducer";

describe("Meet Room meetRoomReducer", () => {
    it("should return the initial state when no matching action type", () => {
        const action = { type: "UNKNOWN_ACTION" };
        const result = meetRoomReducer(undefined, action);

        expect(result).toEqual(initialState);
    });

    it("should handle SET_JOIN_ROOM_ERROR action", () => {
        const errorMessage = "Failed to join room";
        const action = {
            type: SET_JOIN_ROOM_ERROR,
            joinRoomError: true,
            message: errorMessage,
        };

        const expectedState = {
            ...initialState,
            joinRoomError: true,
            joinRoomErrorMessage: errorMessage,
        };

        const result = meetRoomReducer(initialState, action);

        expect(result).toEqual(expectedState);
        expect(result).not.toBe(initialState);
    });

    it("should handle SET_CREATE_ROOM_ERROR action", () => {
        const errorMessage = "Failed to create room";
        const action = {
            type: SET_CREATE_ROOM_ERROR,
            createRoomError: true,
            message: errorMessage,
        };

        const expectedState = {
            ...initialState,
            createRoomError: true,
            createRoomErrorMessage: errorMessage,
        };

        const result = meetRoomReducer(initialState, action);

        expect(result).toEqual(expectedState);
        expect(result).not.toBe(initialState);
    });

    it("should handle SET_ROOM_ID action", () => {
        const roomID = "test-room-123";
        const action = {
            type: SET_ROOM_ID,
            roomID,
        };

        const expectedState = {
            ...initialState,
            roomID,
        };

        const result = meetRoomReducer(initialState, action);

        expect(result).toEqual(expectedState);
        expect(result).not.toBe(initialState);
    });

    it("should not affect other state properties when updating one property", () => {
        const modifiedState = {
            ...initialState,
            joinRoomError: true,
            joinRoomErrorMessage: "Join error",
            roomID: "existing-room",
        };
        const errorMessage = "Failed to create room";
        const action = {
            type: SET_CREATE_ROOM_ERROR,
            createRoomError: true,
            message: errorMessage,
        };

        const expectedState = {
            ...modifiedState,
            createRoomError: true,
            createRoomErrorMessage: errorMessage,
        };

        const result = meetRoomReducer(modifiedState, action);

        expect(result).toEqual(expectedState);
        expect(result.joinRoomError).toBe(true);
        expect(result.joinRoomErrorMessage).toBe("Join error");
        expect(result.roomID).toBe("existing-room");
    });

    it("should handle setting values back to false/null", () => {
        const modifiedState = {
            joinRoomError: true,
            joinRoomErrorMessage: "Join error",
            createRoomError: true,
            createRoomErrorMessage: "Create error",
            roomID: "existing-room",
        };

        const joinAction = {
            type: SET_JOIN_ROOM_ERROR,
            joinRoomError: false,
            message: "",
        };

        const createAction = {
            type: SET_CREATE_ROOM_ERROR,
            createRoomError: false,
            message: "",
        };

        const roomAction = {
            type: SET_ROOM_ID,
            roomID: null,
        };

        const joinResult = meetRoomReducer(modifiedState, joinAction);
        expect(joinResult.joinRoomError).toBe(false);
        expect(joinResult.joinRoomErrorMessage).toBe("");

        const createResult = meetRoomReducer(modifiedState, createAction);
        expect(createResult.createRoomError).toBe(false);
        expect(createResult.createRoomErrorMessage).toBe("");

        const roomResult = meetRoomReducer(modifiedState, roomAction);
        expect(roomResult.roomID).toBe(null);
    });
});

describe("Meet Room Action Creators", () => {
    it("setJoinRoomError should create the correct action", () => {
        const errorMessage = "Failed to join";
        const expectedAction = {
            type: SET_JOIN_ROOM_ERROR,
            joinRoomError: true,
            message: errorMessage,
        };

        expect(setJoinRoomError(true, errorMessage)).toEqual(expectedAction);
    });

    it("setCreateRoomError should create the correct action", () => {
        const errorMessage = "Failed to create";
        const expectedAction = {
            type: SET_CREATE_ROOM_ERROR,
            createRoomError: true,
            message: errorMessage,
        };

        expect(setCreateRoomError(true, errorMessage)).toEqual(expectedAction);
    });

    it("setRoomID should create the correct action", () => {
        const roomID = "test-room-456";
        const expectedAction = {
            type: SET_ROOM_ID,
            roomID,
        };

        expect(setRoomID(roomID)).toEqual(expectedAction);
    });

    it("should create action with empty error message when not provided", () => {
        expect(setJoinRoomError(true).message).toBe("");
        expect(setCreateRoomError(false).message).toBe("");
    });
});
