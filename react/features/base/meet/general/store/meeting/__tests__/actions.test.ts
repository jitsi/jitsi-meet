import { describe, expect, it } from "vitest";
import { setCurrentRoom, updateMeetingConfig } from "../actions";
import { SET_CURRENT_ROOM, UPDATE_MEETING_CONFIG } from "../actionTypes";

describe("Meeting Actions", () => {
    describe("updateMeetingConfig", () => {
        it("When called with meeting configuration, then it should return the correct action", () => {
            const mockConfig = {
                enabled: true,
                paxPerCall: 10,
            };

            const result = updateMeetingConfig(mockConfig);

            expect(result).toEqual({
                type: UPDATE_MEETING_CONFIG,
                payload: mockConfig,
            });
        });

        it("When called with disabled configuration, then it should return action with enabled=false", () => {
            const mockConfig = {
                enabled: false,
                paxPerCall: 0,
            };

            const result = updateMeetingConfig(mockConfig);

            expect(result).toEqual({
                type: UPDATE_MEETING_CONFIG,
                payload: {
                    enabled: false,
                    paxPerCall: 0,
                },
            });
        });
    });

    describe("setCurrentRoom", () => {
        it("When called with roomId, then it should return the correct action", () => {
            const roomId = "room-123";

            const result = setCurrentRoom(roomId);

            expect(result).toEqual({
                type: SET_CURRENT_ROOM,
                payload: { roomId },
            });
        });

        it("When called with null, then it should return action with roomId=null", () => {
            const result = setCurrentRoom(null);

            expect(result).toEqual({
                type: SET_CURRENT_ROOM,
                payload: { roomId: null },
            });
        });
    });
});
