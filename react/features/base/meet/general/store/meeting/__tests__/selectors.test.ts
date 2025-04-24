import { describe, expect, it } from "vitest";
import { IReduxState } from "../../../../../../app/types";
import { MEETING_REDUCER } from "../reducer";
import { getCurrentRoomId, getMaxParticipantsPerCall, getMeetingConfig, isMeetingEnabled } from "../selectors";
import { MeetingState } from "../types";

describe("Meeting Selectors", () => {
    const createMockState = (meetingState: MeetingState): IReduxState => {
        return {
            [MEETING_REDUCER]: meetingState,
        } as unknown as IReduxState;
    };

    describe("getMeetingConfig", () => {
        it("When called with state, then it should return the meeting configuration", () => {
            const mockState = createMockState({
                enabled: true,
                paxPerCall: 8,
                currentRoomId: "room-123",
            });

            const result = getMeetingConfig(mockState);

            expect(result).toEqual({
                enabled: true,
                paxPerCall: 8,
            });
        });

        it("When called with disabled state, then it should return disabled configuration", () => {
            const mockState = createMockState({
                enabled: false,
                paxPerCall: 0,
                currentRoomId: null,
            });

            const result = getMeetingConfig(mockState);

            expect(result).toEqual({
                enabled: false,
                paxPerCall: 0,
            });
        });
    });

    describe("isMeetingEnabled", () => {
        it("When meeting is enabled, then it should return true", () => {
            const mockState = createMockState({
                enabled: true,
                paxPerCall: 5,
                currentRoomId: "room-123",
            });

            const result = isMeetingEnabled(mockState);

            expect(result).toBe(true);
        });

        it("When meeting is disabled, then it should return false", () => {
            const mockState = createMockState({
                enabled: false,
                paxPerCall: 0,
                currentRoomId: "room-123",
            });

            const result = isMeetingEnabled(mockState);

            expect(result).toBe(false);
        });
    });

    describe("getCurrentRoomId", () => {
        it("When room is set, then it should return the room ID", () => {
            const roomId = "room-456";
            const mockState = createMockState({
                enabled: true,
                paxPerCall: 10,
                currentRoomId: roomId,
            });

            const result = getCurrentRoomId(mockState);

            expect(result).toBe(roomId);
        });

        it("When no room is set, then it should return null", () => {
            const mockState = createMockState({
                enabled: true,
                paxPerCall: 10,
                currentRoomId: null,
            });

            const result = getCurrentRoomId(mockState);

            expect(result).toBe(null);
        });
    });

    describe("getMaxParticipantsPerCall", () => {
        it("When state has paxPerCall, then it should return the correct value", () => {
            const mockState = createMockState({
                enabled: true,
                paxPerCall: 15,
                currentRoomId: "room-id",
            });

            const result = getMaxParticipantsPerCall(mockState);

            expect(result).toBe(15);
        });

        it("When state has zero paxPerCall, then it should return 0", () => {
            const mockState = createMockState({
                enabled: false,
                paxPerCall: 0,
                currentRoomId: null,
            });

            const result = getMaxParticipantsPerCall(mockState);

            expect(result).toBe(0);
        });
    });
});
