import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get8x8BetaJWT } from "../../connection/options8x8";
import MeetingService from "./meeting.service";

vi.mock("../../connection/options8x8", () => ({
    get8x8BetaJWT: vi.fn(),
}));

describe("MeetingService", () => {
    const originalConsoleError = console.error;

    beforeEach(() => {
        console.error = vi.fn();
        vi.clearAllMocks();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe("getInstance", () => {
        it("should create a singleton instance", () => {
            const instance1 = MeetingService.getInstance();
            const instance2 = MeetingService.getInstance();

            expect(instance1).toBeDefined();
            expect(instance1).toBe(instance2);
        });
    });

    describe("generateMeetingRoom", () => {
        it("should generate a meeting room successfully", async () => {
            const mockToken = "valid-jwt-token";
            const mockMeetData = {
                token: "meeting-token",
                room: "meeting-room-123",
            };

            (get8x8BetaJWT as any).mockResolvedValue(mockMeetData);

            const meetingService = MeetingService.getInstance();

            const result = await meetingService.generateMeetingRoom(mockToken);

            expect(get8x8BetaJWT).toHaveBeenCalledWith(mockToken);
            expect(result).toBe("meeting-room-123");
        });

        it("should return error when meeting room generation fails", async () => {
            const mockToken = "invalid-jwt-token";
            const mockError = new Error("Failed to generate meeting");

            (get8x8BetaJWT as any).mockRejectedValue(mockError);

            const meetingService = MeetingService.getInstance();

            await expect(meetingService.generateMeetingRoom(mockToken)).rejects.toThrow(mockError);
            expect(get8x8BetaJWT).toHaveBeenCalledWith(mockToken);
        });

        it("should handle null or undefined meeting data properly", async () => {
            const mockToken = "valid-jwt-token";
            const mockMeetData = {
                token: "meeting-token",
            };

            (get8x8BetaJWT as any).mockResolvedValue(mockMeetData);

            const meetingService = MeetingService.getInstance();

            const result = await meetingService.generateMeetingRoom(mockToken);

            expect(get8x8BetaJWT).toHaveBeenCalledWith(mockToken);
            expect(result).toBeFalsy();
        });

        it("should handle empty string token", async () => {
            const mockToken = "";
            const mockError = new Error("Invalid token");

            (get8x8BetaJWT as any).mockRejectedValue(mockError);

            const meetingService = MeetingService.getInstance();

            await expect(meetingService.generateMeetingRoom(mockToken)).rejects.toThrow(mockError);
            expect(get8x8BetaJWT).toHaveBeenCalledWith("");
        });
    });
});
