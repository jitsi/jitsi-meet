import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from "vitest";
import { PaymentsService } from "../payments.service";
import { SdkManager } from "../sdk-manager.service";

vi.mock("../sdk-manager.service", () => {
    return {
        SdkManager: {
            instance: {
                getPayments: vi.fn(),
            },
        },
    };
});

describe("PaymentsService", () => {
    const originalConsoleError = console.error;

    beforeEach(() => {
        console.error = vi.fn();
        vi.clearAllMocks();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe("instance", () => {
        it("When accessing the instance, then a singleton instance is returned", () => {
            const instance = PaymentsService.instance;

            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(PaymentsService);
        });
    });

    describe("checkMeetAvailability", () => {
        it("When checking meet availability with meet features, then meet object is returned", async () => {
            const mockMeetObject = {
                allowed: true,
                maxHours: 10,
                maxParticipants: 5,
            };

            const mockUserTier = {
                featuresPerService: {
                    meet: mockMeetObject,
                },
            };

            const mockPaymentsClient = {
                getUserTier: vi.fn().mockResolvedValue(mockUserTier),
            };

            const getPaymentsMock = SdkManager.instance.getPayments as unknown as MockInstance;
            getPaymentsMock.mockReturnValue(mockPaymentsClient);

            const result = await PaymentsService.instance.checkMeetAvailability();

            expect(getPaymentsMock).toHaveBeenCalledTimes(1);
            expect(getPaymentsMock).toHaveBeenCalledWith();
            expect(getPaymentsMock.mock.calls[0].length).toBe(0);

            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledTimes(1);
            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledWith();
            expect(mockPaymentsClient.getUserTier.mock.calls[0].length).toBe(0);

            expect(result).toEqual(mockMeetObject);
        });

        it("When checking meet availability without meet features, then undefined is returned", async () => {
            const mockUserTier = {
                featuresPerService: {
                    drive: { allowed: true },
                },
            };

            const mockPaymentsClient = {
                getUserTier: vi.fn().mockResolvedValue(mockUserTier),
            };

            const getPaymentsMock = SdkManager.instance.getPayments as unknown as MockInstance;
            getPaymentsMock.mockReturnValue(mockPaymentsClient);

            const result = await PaymentsService.instance.checkMeetAvailability();

            expect(getPaymentsMock).toHaveBeenCalledTimes(1);
            expect(getPaymentsMock).toHaveBeenCalledWith();
            expect(getPaymentsMock.mock.calls[0].length).toBe(0);

            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledTimes(1);
            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledWith();
            expect(mockPaymentsClient.getUserTier.mock.calls[0].length).toBe(0);

            expect(result).toBeUndefined();
        });

        it("When checking meet availability with empty featuresPerService, then undefined is returned", async () => {
            const mockUserTier = {
                featuresPerService: {},
            };

            const mockPaymentsClient = {
                getUserTier: vi.fn().mockResolvedValue(mockUserTier),
            };

            const getPaymentsMock = SdkManager.instance.getPayments as unknown as MockInstance;
            getPaymentsMock.mockReturnValue(mockPaymentsClient);

            const result = await PaymentsService.instance.checkMeetAvailability();

            expect(getPaymentsMock).toHaveBeenCalledTimes(1);
            expect(getPaymentsMock).toHaveBeenCalledWith();
            expect(getPaymentsMock.mock.calls[0].length).toBe(0);

            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledTimes(1);
            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledWith();
            expect(mockPaymentsClient.getUserTier.mock.calls[0].length).toBe(0);

            expect(result).toBeUndefined();
        });

        it("When getUserTier throws an error, then the error is propagated", async () => {
            const mockError = new Error("Failed to get user tier");

            const mockPaymentsClient = {
                getUserTier: vi.fn().mockRejectedValue(mockError),
            };

            const getPaymentsMock = SdkManager.instance.getPayments as unknown as MockInstance;
            getPaymentsMock.mockReturnValue(mockPaymentsClient);

            await expect(PaymentsService.instance.checkMeetAvailability()).rejects.toThrow(mockError);

            expect(getPaymentsMock).toHaveBeenCalledTimes(1);
            expect(getPaymentsMock).toHaveBeenCalledWith();
            expect(getPaymentsMock.mock.calls[0].length).toBe(0);

            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledTimes(1);
            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledWith();
            expect(mockPaymentsClient.getUserTier.mock.calls[0].length).toBe(0);
        });

        it("When getPayments throws an error, then the error is propagated", async () => {
            const mockError = new Error("Failed to get payments client");

            const getPaymentsMock = SdkManager.instance.getPayments as unknown as MockInstance;
            getPaymentsMock.mockImplementation(() => {
                throw mockError;
            });

            await expect(PaymentsService.instance.checkMeetAvailability()).rejects.toThrow(mockError);

            expect(getPaymentsMock).toHaveBeenCalledTimes(1);
            expect(getPaymentsMock).toHaveBeenCalledWith();
            expect(getPaymentsMock.mock.calls[0].length).toBe(0);
        });
    });
});
