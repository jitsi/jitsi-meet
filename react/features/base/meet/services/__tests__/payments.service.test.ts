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

    describe("getUserTier", () => {
        it("When getting user tier with complete data, then tier object is returned", async () => {
            const mockUserTier = {
                id: "tier-123",
                label: "Premium Plan",
                productId: "product-456",
                billingType: "subscription" as const,
                featuresPerService: {
                    meet: {
                        enabled: true,
                        paxPerCall: 10,
                    },
                    drive: {},
                    backups: {},
                    antivirus: {},
                    mail: {},
                    vpn: {},
                    cleaner: {},
                },
            };

            const mockPaymentsClient = {
                getUserTier: vi.fn().mockResolvedValue(mockUserTier),
            };

            const getPaymentsMock = SdkManager.instance.getPayments as unknown as MockInstance;
            getPaymentsMock.mockReturnValue(mockPaymentsClient);

            const result = await PaymentsService.instance.getUserTier();

            expect(getPaymentsMock).toHaveBeenCalledTimes(1);
            expect(getPaymentsMock).toHaveBeenCalledWith();
            expect(getPaymentsMock.mock.calls[0].length).toBe(0);

            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledTimes(1);
            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledWith();
            expect(mockPaymentsClient.getUserTier.mock.calls[0].length).toBe(0);

            expect(result).toEqual(mockUserTier);
            expect(result.label).toBe("Premium Plan");
            expect(result.featuresPerService.meet.enabled).toBe(true);
            expect(result.featuresPerService.meet.paxPerCall).toBe(10);
        });

        it("When getting user tier for free plan, then correct tier is returned", async () => {
            const mockUserTier = {
                id: "tier-free",
                label: "Free",
                productId: "product-free",
                billingType: "subscription" as const,
                featuresPerService: {
                    meet: {
                        enabled: false,
                        paxPerCall: 0,
                    },
                    drive: {},
                    backups: {},
                    antivirus: {},
                    mail: {},
                    vpn: {},
                    cleaner: {},
                },
            };

            const mockPaymentsClient = {
                getUserTier: vi.fn().mockResolvedValue(mockUserTier),
            };

            const getPaymentsMock = SdkManager.instance.getPayments as unknown as MockInstance;
            getPaymentsMock.mockReturnValue(mockPaymentsClient);

            const result = await PaymentsService.instance.getUserTier();

            expect(result.label).toBe("Free");
            expect(result.featuresPerService.meet.enabled).toBe(false);
        });

        it("When getUserTier throws an error, then the error is propagated", async () => {
            const mockError = new Error("Failed to get user tier");

            const mockPaymentsClient = {
                getUserTier: vi.fn().mockRejectedValue(mockError),
            };

            const getPaymentsMock = SdkManager.instance.getPayments as unknown as MockInstance;
            getPaymentsMock.mockReturnValue(mockPaymentsClient);

            await expect(PaymentsService.instance.getUserTier()).rejects.toThrow(mockError);

            expect(getPaymentsMock).toHaveBeenCalledTimes(1);
            expect(mockPaymentsClient.getUserTier).toHaveBeenCalledTimes(1);
        });

        it("When getPayments throws an error, then the error is propagated", async () => {
            const mockError = new Error("Failed to get payments client");

            const getPaymentsMock = SdkManager.instance.getPayments as unknown as MockInstance;
            getPaymentsMock.mockImplementation(() => {
                throw mockError;
            });

            await expect(PaymentsService.instance.getUserTier()).rejects.toThrow(mockError);

            expect(getPaymentsMock).toHaveBeenCalledTimes(1);
        });
    });
});
