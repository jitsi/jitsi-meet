import { describe, it, expect } from 'vitest';
import { meetRoomReducer, initialState } from '../reducer';
import {
  SET_CREATE_ROOM_ERROR,
  SET_JOIN_ROOM_ERROR,
  SET_ROOM_ID
} from '../actionTypes';
import { setJoinRoomError, setCreateRoomError, setRoomID } from "../actions";

describe("Meet Room meetRoomReducer", () => {
    it("should return the initial state when no matching action type", () => {
        const action = { type: "UNKNOWN_ACTION" };
        const result = meetRoomReducer(undefined, action);

        expect(result).toEqual(initialState);
    });

    it("should handle SET_JOIN_ROOM_ERROR action", () => {
        const action = {
            type: SET_JOIN_ROOM_ERROR,
            joinRoomError: true,
        };

        const expectedState = {
            ...initialState,
            joinRoomError: true,
        };

        const result = meetRoomReducer(initialState, action);

        expect(result).toEqual(expectedState);
        expect(result).not.toBe(initialState);
    });

    it("should handle SET_CREATE_ROOM_ERROR action", () => {
        const action = {
            type: SET_CREATE_ROOM_ERROR,
            createRoomError: true,
        };

        const expectedState = {
            ...initialState,
            createRoomError: true,
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
            roomID: "existing-room",
        };

        const action = {
            type: SET_CREATE_ROOM_ERROR,
            createRoomError: true,
        };

        const expectedState = {
            ...modifiedState,
            createRoomError: true,
        };

        const result = meetRoomReducer(modifiedState, action);

        expect(result).toEqual(expectedState);
        expect(result.joinRoomError).toBe(true);
        expect(result.roomID).toBe("existing-room");
    });

    it("should handle setting values back to false/null", () => {
        const modifiedState = {
            joinRoomError: true,
            createRoomError: true,
            roomID: "existing-room",
        };

        const joinAction = {
            type: SET_JOIN_ROOM_ERROR,
            joinRoomError: false,
        };

        const createAction = {
            type: SET_CREATE_ROOM_ERROR,
            createRoomError: false,
        };

        const roomAction = {
            type: SET_ROOM_ID,
            roomID: null,
        };

        const joinResult = meetRoomReducer(modifiedState, joinAction);
        expect(joinResult.joinRoomError).toBe(false);

        const createResult = meetRoomReducer(modifiedState, createAction);
        expect(createResult.createRoomError).toBe(false);

        const roomResult = meetRoomReducer(modifiedState, roomAction);
        expect(roomResult.roomID).toBe(null);
    });
});

describe("Meet Room Action Creators", () => {
    it("setJoinRoomError should create the correct action", () => {
        const expectedAction = {
            type: SET_JOIN_ROOM_ERROR,
            joinRoomError: true,
        };

        expect(setJoinRoomError(true)).toEqual(expectedAction);
    });

    it("setCreateRoomError should create the correct action", () => {
        const expectedAction = {
            type: SET_CREATE_ROOM_ERROR,
            createRoomError: true,
        };

        expect(setCreateRoomError(true)).toEqual(expectedAction);
    });

    it("setRoomID should create the correct action", () => {
        const roomID = "test-room-456";
        const expectedAction = {
            type: SET_ROOM_ID,
            roomID,
        };

        expect(setRoomID(roomID)).toEqual(expectedAction);
    });
});
