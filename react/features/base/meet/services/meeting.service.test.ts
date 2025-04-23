import { JoinCallPayload } from "@internxt/sdk/dist/meet/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get8x8BetaJWT } from "../../connection/options8x8";
import MeetingService from "./meeting.service";
import { SdkManager } from "./sdk-manager.service";

// Crear tipos para los mocks que faciliten la verificación estricta
type MockedGet8x8BetaJWT = ReturnType<typeof vi.fn> & typeof get8x8BetaJWT;
type MockedGetMeet = ReturnType<typeof vi.fn> & typeof SdkManager.instance.getMeet;

vi.mock("../../connection/options8x8", () => ({
    get8x8BetaJWT: vi.fn(),
}));

vi.mock("./sdk-manager.service", () => ({
    SdkManager: {
        instance: {
            getMeet: vi.fn(),
        },
    },
}));

describe("MeetingService", () => {
    const originalConsoleError = console.error;

    // Obtener las versiones mockeadas con tipos adecuados
    const mockedGet8x8BetaJWT = get8x8BetaJWT as MockedGet8x8BetaJWT;
    const mockedGetMeet = SdkManager.instance.getMeet as MockedGetMeet;

    beforeEach(() => {
        console.error = vi.fn();
        vi.clearAllMocks();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe("getInstance", () => {
        it("When getting multiple instances, then they should be the same singleton instance", () => {
            const instance1 = MeetingService.getInstance();
            const instance2 = MeetingService.getInstance();

            expect(instance1).toBeDefined();
            expect(instance1).toBe(instance2);
        });
    });

    describe("generateMeetingRoom", () => {
        it("When generating a meeting room with valid token, then the room ID is returned", async () => {
            const mockToken = "valid-jwt-token";
            const mockMeetData = {
                token: "meeting-token",
                room: "meeting-room-123",
            };

            mockedGet8x8BetaJWT.mockResolvedValue(mockMeetData);

            const meetingService = MeetingService.getInstance();

            const result = await meetingService.generateMeetingRoom(mockToken);

            expect(mockedGet8x8BetaJWT).toHaveBeenCalledTimes(1);
            expect(mockedGet8x8BetaJWT).toHaveBeenCalledWith(mockToken);
            expect(mockedGet8x8BetaJWT.mock.calls[0].length).toBe(1);
            expect(mockedGet8x8BetaJWT.mock.calls[0][0]).toBe(mockToken);
            expect(result).toBe("meeting-room-123");
        });

        it("When generating a meeting room with invalid token, then an error is thrown", async () => {
            const mockToken = "invalid-jwt-token";
            const mockError = new Error("Failed to generate meeting");

            mockedGet8x8BetaJWT.mockRejectedValue(mockError);

            const meetingService = MeetingService.getInstance();

            await expect(meetingService.generateMeetingRoom(mockToken)).rejects.toThrow(mockError);
            expect(mockedGet8x8BetaJWT).toHaveBeenCalledTimes(1);
            expect(mockedGet8x8BetaJWT).toHaveBeenCalledWith(mockToken);
            expect(mockedGet8x8BetaJWT.mock.calls[0].length).toBe(1);
            expect(mockedGet8x8BetaJWT.mock.calls[0][0]).toBe(mockToken);
        });

        it("When meeting data is missing room property, then falsy value is returned", async () => {
            const mockToken = "valid-jwt-token";
            const mockMeetData = {
                token: "meeting-token",
            };

            mockedGet8x8BetaJWT.mockResolvedValue(mockMeetData);

            const meetingService = MeetingService.getInstance();

            const result = await meetingService.generateMeetingRoom(mockToken);

            expect(mockedGet8x8BetaJWT).toHaveBeenCalledTimes(1);
            expect(mockedGet8x8BetaJWT).toHaveBeenCalledWith(mockToken);
            expect(mockedGet8x8BetaJWT.mock.calls[0].length).toBe(1);
            expect(mockedGet8x8BetaJWT.mock.calls[0][0]).toBe(mockToken);
            expect(result).toBeFalsy();
        });

        it("When token is empty string, then an error is thrown", async () => {
            const mockToken = "";
            const mockError = new Error("Invalid token");

            mockedGet8x8BetaJWT.mockRejectedValue(mockError);

            const meetingService = MeetingService.getInstance();

            await expect(meetingService.generateMeetingRoom(mockToken)).rejects.toThrow(mockError);
            expect(mockedGet8x8BetaJWT).toHaveBeenCalledTimes(1);
            expect(mockedGet8x8BetaJWT).toHaveBeenCalledWith("");
            expect(mockedGet8x8BetaJWT.mock.calls[0].length).toBe(1);
            expect(mockedGet8x8BetaJWT.mock.calls[0][0]).toBe(""); // Verify parameter
        });
    });

    describe("createCall", () => {
        it("When creating a call, then the call details are returned", async () => {
            const mockCreateCallResponse = {
                id: "call-123",
                createdAt: new Date().toISOString(),
                status: "created",
            };

            const mockMeetClient = {
                createCall: vi.fn().mockResolvedValue(mockCreateCallResponse),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const meetingService = MeetingService.getInstance();
            const result = await meetingService.createCall();

            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.createCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.createCall).toHaveBeenCalledWith();
            expect(mockMeetClient.createCall.mock.calls[0].length).toBe(0);
            expect(result).toEqual(mockCreateCallResponse);
        });

        it("When call creation fails, then an error is thrown", async () => {
            const mockError = new Error("Failed to create call");

            const mockMeetClient = {
                createCall: vi.fn().mockRejectedValue(mockError),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const meetingService = MeetingService.getInstance();

            await expect(meetingService.createCall()).rejects.toThrow(mockError);
            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.createCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.createCall).toHaveBeenCalledWith();
            expect(mockMeetClient.createCall.mock.calls[0].length).toBe(0);
        });
    });

    describe("joinCall", () => {
        it("When joining a call with valid ID and payload, then session details are returned", async () => {
            const mockCallId = "call-123";
            const mockPayload: JoinCallPayload = {
                name: "John",
                lastname: "Doe",
                anonymous: false,
            };

            const mockJoinCallResponse = {
                sessionId: "session-456",
                token: "join-token-789",
            };

            const mockMeetClient = {
                joinCall: vi.fn().mockResolvedValue(mockJoinCallResponse),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const meetingService = MeetingService.getInstance();
            const result = await meetingService.joinCall(mockCallId, mockPayload);

            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.joinCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.joinCall).toHaveBeenCalledWith(mockCallId, mockPayload);
            expect(mockMeetClient.joinCall.mock.calls[0].length).toBe(2);
            expect(mockMeetClient.joinCall.mock.calls[0][0]).toBe(mockCallId);
            expect(mockMeetClient.joinCall.mock.calls[0][1]).toEqual(mockPayload);
            expect(result).toEqual(mockJoinCallResponse);
        });

        it("When joining a call with invalid ID, then an error is thrown", async () => {
            const mockCallId = "invalid-call-id";
            const mockPayload: JoinCallPayload = {
                name: "John",
                lastname: "Doe",
                anonymous: false,
            };

            const mockError = new Error("Failed to join call");

            const mockMeetClient = {
                joinCall: vi.fn().mockRejectedValue(mockError),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const meetingService = MeetingService.getInstance();

            await expect(meetingService.joinCall(mockCallId, mockPayload)).rejects.toThrow(mockError);
            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.joinCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.joinCall).toHaveBeenCalledWith(mockCallId, mockPayload);
            expect(mockMeetClient.joinCall.mock.calls[0].length).toBe(2);
            expect(mockMeetClient.joinCall.mock.calls[0][0]).toBe(mockCallId);
            expect(mockMeetClient.joinCall.mock.calls[0][1]).toEqual(mockPayload);
        });

        it("When joining a call with empty ID, then an error is thrown", async () => {
            const mockCallId = "";
            const mockPayload: JoinCallPayload = {
                name: "John",
                lastname: "Doe",
                anonymous: false,
            };

            const mockError = new Error("Invalid call ID");

            const mockMeetClient = {
                joinCall: vi.fn().mockRejectedValue(mockError),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const meetingService = MeetingService.getInstance();

            await expect(meetingService.joinCall(mockCallId, mockPayload)).rejects.toThrow(mockError);
            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.joinCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.joinCall).toHaveBeenCalledWith(mockCallId, mockPayload);
            expect(mockMeetClient.joinCall.mock.calls[0].length).toBe(2);
            expect(mockMeetClient.joinCall.mock.calls[0][0]).toBe("");
        });
    });

    describe("getCurrentUsersInCall", () => {
        it("When getting users in a call with participants, then an array of users is returned", async () => {
            const mockCallId = "call-123";
            const mockUsersResponse = [
                { id: "user-1", name: "John", lastname: "Doe", joinedAt: new Date().toISOString() },
                { id: "user-2", name: "Jane", lastname: "Smith", joinedAt: new Date().toISOString() },
            ];

            const mockMeetClient = {
                getCurrentUsersInCall: vi.fn().mockResolvedValue(mockUsersResponse),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const meetingService = MeetingService.getInstance();
            const result = await meetingService.getCurrentUsersInCall(mockCallId);

            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.getCurrentUsersInCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.getCurrentUsersInCall).toHaveBeenCalledWith(mockCallId);
            expect(mockMeetClient.getCurrentUsersInCall.mock.calls[0].length).toBe(1);
            expect(mockMeetClient.getCurrentUsersInCall.mock.calls[0][0]).toBe(mockCallId);
            expect(result).toEqual(mockUsersResponse);
        });

        it("When getting users in an empty call, then an empty array is returned", async () => {
            const mockCallId = "empty-call-123";
            const mockUsersResponse: any[] = [];

            const mockMeetClient = {
                getCurrentUsersInCall: vi.fn().mockResolvedValue(mockUsersResponse),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const meetingService = MeetingService.getInstance();
            const result = await meetingService.getCurrentUsersInCall(mockCallId);

            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.getCurrentUsersInCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.getCurrentUsersInCall).toHaveBeenCalledWith(mockCallId);
            expect(mockMeetClient.getCurrentUsersInCall.mock.calls[0].length).toBe(1);
            expect(mockMeetClient.getCurrentUsersInCall.mock.calls[0][0]).toBe(mockCallId);
            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });

        it("When getting users with invalid call ID, then an error is thrown", async () => {
            const mockCallId = "invalid-call-id";
            const mockError = new Error("Failed to get users in call");

            const mockMeetClient = {
                getCurrentUsersInCall: vi.fn().mockRejectedValue(mockError),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const meetingService = MeetingService.getInstance();

            await expect(meetingService.getCurrentUsersInCall(mockCallId)).rejects.toThrow(mockError);
            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.getCurrentUsersInCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.getCurrentUsersInCall).toHaveBeenCalledWith(mockCallId);
            expect(mockMeetClient.getCurrentUsersInCall.mock.calls[0].length).toBe(1);
            expect(mockMeetClient.getCurrentUsersInCall.mock.calls[0][0]).toBe(mockCallId);
        });
    });
});
