import {
    CreateCallResponse,
    JoinCallPayload,
    JoinCallResponse,
    UsersInCallResponse,
} from "@internxt/sdk/dist/meet/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MeetingService from "../meeting.service";
import { SdkManager } from "../sdk-manager.service";

type MockedGetMeet = ReturnType<typeof vi.fn> & typeof SdkManager.instance.getMeet;

vi.mock("../../../connection/options8x8", () => ({
    get8x8BetaJWT: vi.fn(),
}));

vi.mock("../sdk-manager.service", () => ({
    SdkManager: {
        instance: {
            getMeet: vi.fn(),
        },
    },
}));

describe("MeetingService", () => {
    const originalConsoleError = console.error;

    const mockedGetMeet = SdkManager.instance.getMeet as MockedGetMeet;

    beforeEach(() => {
        console.error = vi.fn();
        vi.clearAllMocks();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe("instance", () => {
        it("When accessing multiple times, then they should be the same singleton instance", () => {
            const instance1 = MeetingService.instance;
            const instance2 = MeetingService.instance;

            expect(instance1).toBeDefined();
            expect(instance1).toBe(instance2);
        });

        it("When accessing instance, then it should be an instance of MeetingService", () => {
            const instance = MeetingService.instance;

            expect(instance).toBeInstanceOf(MeetingService);
        });
    });

    describe("createCall", () => {
        it("When creating a call, then the call details are returned", async () => {
            const mockCreateCallResponse: CreateCallResponse = {
                token: "token-123",
                room: "room-123",
                paxPerCall: 10,
            };

            const mockMeetClient = {
                createCall: vi.fn().mockResolvedValue(mockCreateCallResponse),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const result = await MeetingService.instance.createCall();

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

            await expect(MeetingService.instance.createCall()).rejects.toThrow(mockError);
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

            const mockJoinCallResponse: JoinCallResponse = {
                token: "join-token-789",
                room: "room-123",
                userId: "user-456",
            };

            const mockMeetClient = {
                joinCall: vi.fn().mockResolvedValue(mockJoinCallResponse),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const result = await MeetingService.instance.joinCall(mockCallId, mockPayload);

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

            await expect(MeetingService.instance.joinCall(mockCallId, mockPayload)).rejects.toThrow(mockError);
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

            await expect(MeetingService.instance.joinCall(mockCallId, mockPayload)).rejects.toThrow(mockError);
            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.joinCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.joinCall).toHaveBeenCalledWith(mockCallId, mockPayload);
            expect(mockMeetClient.joinCall.mock.calls[0].length).toBe(2);
            expect(mockMeetClient.joinCall.mock.calls[0][0]).toBe("");
        });
    });

    describe("leaveCall", () => {
        it("When leaving a call with valid ID, then the operation completes successfully", async () => {
            const mockCallId = "call-123";
            const mockLeaveCallResponse = { success: true };

            const mockMeetClient = {
                leaveCall: vi.fn().mockResolvedValue(mockLeaveCallResponse),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const result = await MeetingService.instance.leaveCall(mockCallId);

            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.leaveCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.leaveCall).toHaveBeenCalledWith(mockCallId);
            expect(mockMeetClient.leaveCall.mock.calls[0].length).toBe(1);
            expect(mockMeetClient.leaveCall.mock.calls[0][0]).toBe(mockCallId);
            expect(result).toEqual(mockLeaveCallResponse);
        });

        it("When leaving a call fails, then an error is thrown", async () => {
            const mockCallId = "call-123";
            const mockError = new Error("Failed to leave call");

            const mockMeetClient = {
                leaveCall: vi.fn().mockRejectedValue(mockError),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            await expect(MeetingService.instance.leaveCall(mockCallId)).rejects.toThrow(mockError);
            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.leaveCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.leaveCall).toHaveBeenCalledWith(mockCallId);
            expect(mockMeetClient.leaveCall.mock.calls[0].length).toBe(1);
            expect(mockMeetClient.leaveCall.mock.calls[0][0]).toBe(mockCallId);
        });
    });

    describe("getCurrentUsersInCall", () => {
        it("When getting users in a call with participants, then an array of users is returned", async () => {
            const mockCallId = "call-123";
            const mockUsersResponse: UsersInCallResponse[] = [
                {
                    userId: "user-1",
                    name: "John",
                    lastname: "Doe",
                    anonymous: false,
                    avatar: "avatar-url-1",
                },
                {
                    userId: "user-2",
                    name: "Jane",
                    lastname: "Smith",
                    anonymous: false,
                    avatar: "avatar-url-2",
                },
            ];

            const mockMeetClient = {
                getCurrentUsersInCall: vi.fn().mockResolvedValue(mockUsersResponse),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const result = await MeetingService.instance.getCurrentUsersInCall(mockCallId);

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
            const mockUsersResponse: UsersInCallResponse[] = [];

            const mockMeetClient = {
                getCurrentUsersInCall: vi.fn().mockResolvedValue(mockUsersResponse),
            };

            mockedGetMeet.mockReturnValue(mockMeetClient);

            const result = await MeetingService.instance.getCurrentUsersInCall(mockCallId);

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

            await expect(MeetingService.instance.getCurrentUsersInCall(mockCallId)).rejects.toThrow(mockError);
            expect(mockedGetMeet).toHaveBeenCalledTimes(1);
            expect(mockedGetMeet).toHaveBeenCalledWith();
            expect(mockMeetClient.getCurrentUsersInCall).toHaveBeenCalledTimes(1);
            expect(mockMeetClient.getCurrentUsersInCall).toHaveBeenCalledWith(mockCallId);
            expect(mockMeetClient.getCurrentUsersInCall.mock.calls[0].length).toBe(1);
            expect(mockMeetClient.getCurrentUsersInCall.mock.calls[0][0]).toBe(mockCallId);
        });
    });
});
