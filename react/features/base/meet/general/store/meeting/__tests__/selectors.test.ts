import { describe, expect, it } from "vitest";
import { IReduxState } from "../../../../../../app/types";
import { MEETING_REDUCER } from "../reducer";
import {
    getCurrentRoomId,
    getMaxParticipantsPerCall,
    getMeetingConfig,
    getPlanName,
    getUserTier,
    isMeetingEnabled
} from "../selectors";
import { MeetingState } from "../types";
import { Service, Tier } from "@internxt/sdk/dist/drive/payments/types/tiers";

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
                planName: null,
                userTier: null,
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
                planName: null,
                userTier: null,
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
                planName: null,
                userTier: null,
            });

            const result = isMeetingEnabled(mockState);

            expect(result).toBe(true);
        });

        it("When meeting is disabled, then it should return false", () => {
            const mockState = createMockState({
                enabled: false,
                paxPerCall: 0,
                currentRoomId: "room-123",
                planName: null,
                userTier: null,
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
                planName: null,
                userTier: null,
            });

            const result = getCurrentRoomId(mockState);

            expect(result).toBe(roomId);
        });

        it("When no room is set, then it should return null", () => {
            const mockState = createMockState({
                enabled: true,
                paxPerCall: 10,
                currentRoomId: null,
                planName: null,
                userTier: null,
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
                planName: null,
                userTier: null,
            });

            const result = getMaxParticipantsPerCall(mockState);

            expect(result).toBe(15);
        });

        it("When state has zero paxPerCall, then it should return 0", () => {
            const mockState = createMockState({
                enabled: false,
                paxPerCall: 0,
                currentRoomId: null,
                planName: null,
                userTier: null,
            });

            const result = getMaxParticipantsPerCall(mockState);

            expect(result).toBe(0);
        });
    });

    describe("getPlanName", () => {
        it("When state has null plan name, then it should return null", () => {
            const mockState = createMockState({
                enabled: false,
                paxPerCall: 0,
                currentRoomId: null,
                planName: null,
                userTier: null,
            });

            const result = getPlanName(mockState);

            expect(result).toBe(null);
        });

        it("When state has technical tier names, then it should return user-friendly names", () => {
            const testCases = [
                { planName: "free", expected: "Free" },
                { planName: "essential", expected: "Essential" },
                { planName: "premium", expected: "Premium" },
                { planName: "ultimate", expected: "Ultimate" },
                { planName: "business-standard", expected: "Business Standard" },
                { planName: "business-pro", expected: "Business Pro" },
                { planName: "Internxt Cleaner", expected: "Internxt Cleaner" },
                { planName: "Internxt Antivirus", expected: "Internxt Antivirus" },
                { planName: "Internxt VPN", expected: "Internxt VPN" },
            ];

            testCases.forEach(({ planName, expected }) => {
                const mockState = createMockState({
                    enabled: true,
                    paxPerCall: 5,
                    currentRoomId: "test-room",
                    planName,
                    userTier: null,
                });

                const result = getPlanName(mockState);

                expect(result).toBe(expected);
            });
        });

        it("When state has unknown plan name with hyphens, then it should format it automatically", () => {
            const testCases = [
                { planName: "some-new-plan", expected: "Some New Plan" },
                { planName: "super-premium-tier", expected: "Super Premium Tier" },
                { planName: "enterprise-deluxe", expected: "Enterprise Deluxe" },
            ];

            testCases.forEach(({ planName, expected }) => {
                const mockState = createMockState({
                    enabled: true,
                    paxPerCall: 10,
                    currentRoomId: "room-id",
                    planName,
                    userTier: null,
                });

                const result = getPlanName(mockState);

                expect(result).toBe(expected);
            });
        });

        it("When state has unknown plan name without hyphens, then it should capitalize it", () => {
            const mockState = createMockState({
                enabled: true,
                paxPerCall: 10,
                currentRoomId: "room-id",
                planName: "enterprise",
                userTier: null,
            });

            const result = getPlanName(mockState);

            expect(result).toBe("Enterprise");
        });
    });

    describe("getUserTier", () => {
        it("When userTier is null, then it should return null", () => {
            const mockState = createMockState({
                enabled: false,
                paxPerCall: 0,
                currentRoomId: null,
                planName: null,
                userTier: null,
            });

            const result = getUserTier(mockState);

            expect(result).toBe(null);
        });

        it("When state has a complete user tier, then it should return all its properties", () => {
            const mockUserTier: Tier = {
                id: 'tier-id',
                billingType: 'lifetime',
                featuresPerService: {
                    [Service.Antivirus]: {
                        enabled: true,
                    },
                    [Service.Backups]: {
                        enabled: true,
                    },
                    [Service.Cleaner]: {
                        enabled: true,
                    },
                    [Service.Drive]: {
                        enabled: true,
                        maxSpaceBytes: 10000,
                        passwordProtectedSharing: { enabled: true },
                        restrictedItemsSharing: { enabled: true },
                        workspaces: {
                            enabled: true,
                            maximumSeats: 5,
                            maxSpaceBytesPerSeat: 1000,
                            minimumSeats: 1
                        },
                    },
                    [Service.Mail]: {
                        enabled: true,
                        addressesPerUser: 10,
                    },
                    [Service.Meet]: {
                        enabled: true,
                        paxPerCall: 10,
                    },
                    [Service.Vpn]: {
                        enabled: true,
                        featureId: 'vpn',
                    },
                    [Service.darkMonitor]: {
                        enabled: true,
                    },
                },
                label: 'Tier label',
                productId: 'tier-product-id',
            };
            const mockState = createMockState({
                enabled: false,
                paxPerCall: 0,
                currentRoomId: null,
                planName: null,
                userTier: mockUserTier,
            });

            const result = getUserTier(mockState);

            expect(result).toBe(mockUserTier);
        });
    });
});
