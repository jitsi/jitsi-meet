import { Auth, Drive, Meet } from "@internxt/sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "../../__tests__/setup";
import { ConfigService } from "../config.service";
import { SdkManager } from "../sdk-manager.service";

vi.mock("@internxt/sdk", () => ({
    Auth: {
        client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
            baseUrl,
            appDetails,
            security,
            unauthorizedCallback: vi.fn(),
        })),
    },
    Drive: {
        Users: {
            client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
                baseUrl,
                appDetails,
                security,
                unauthorizedCallback: vi.fn(),
            })),
        },
        Payments: {
            client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
                baseUrl,
                appDetails,
                security,
                unauthorizedCallback: vi.fn(),
            })),
        },
    },
    Meet: {
        client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
            baseUrl,
            appDetails,
            security,
            unauthorizedCallback: vi.fn(),
        })),
    },
}));

const mockLocalStorage = {
    getItem: vi.fn().mockImplementation((key) => {
        if (key === "xNewToken") return "mock-new-token";
        return null;
    }),
    clearCredentials: vi.fn(),
};

Object.defineProperty(global, "localStorage", {
    value: mockLocalStorage,
    writable: true,
});

// @ts-ignore - Ignore TypeScript error for test purposes
SdkManager.instance.localStorage = mockLocalStorage;

describe("SdkManager", () => {
    beforeEach(() => {
        SdkManager.clean();
        vi.clearAllMocks();
    });

    describe("Initialization", () => {
        it("When initializing with api security, then the security details are stored", () => {
            const mockApiSecurity = {
                token: "test-token",
                newToken: "new-test-token",
                userId: "test-user-id",
            };

            SdkManager.init(mockApiSecurity);
            const storedSecurity = SdkManager.getApiSecurity({ throwErrorOnMissingCredentials: false });
            expect(storedSecurity).toEqual(mockApiSecurity);
        });

        it("When cleaning the manager, then the security details are removed", () => {
            const mockApiSecurity = {
                token: "test-token",
                newToken: "new-test-token",
                userId: "test-user-id",
            };

            SdkManager.init(mockApiSecurity);
            SdkManager.clean();
            const storedSecurity = SdkManager.getApiSecurity({ throwErrorOnMissingCredentials: false });
            expect(storedSecurity).toBeUndefined();
        });

        it("When getting api security without credentials and throwErrorOnMissingCredentials is true, then an error is thrown", () => {
            expect(() => SdkManager.getApiSecurity()).toThrow("Api security properties not found in SdkManager");
        });

        it("When getting api security without credentials and throwErrorOnMissingCredentials is false, then undefined is returned", () => {
            const result = SdkManager.getApiSecurity({ throwErrorOnMissingCredentials: false });
            expect(result).toBeUndefined();
        });
    });

    describe("App details", () => {
        it("When getting app details, then the correct package.json details are returned", () => {
            const appDetails = SdkManager.getAppDetails();
            expect(appDetails).toEqual({
                clientName: "internxt-meet",
                clientVersion: expect.any(String),
            });
        });
    });

    describe("SDK clients", () => {
        const mockApiSecurity = {
            token: "test-token",
            newToken: "new-test-token",
            userId: "test-user-id",
        };

        beforeEach(() => {
            vi.spyOn(ConfigService.instance, "get").mockImplementation((key: string) => {
                const config: Record<string, string> = {
                    DRIVE_NEW_API_URL: "https://test-drive-new-api.com",
                    PAYMENTS_API_URL: "https://test-payments-api.com",
                    MEET_API_URL: "https://test-meet-api.com",
                };
                return config[key];
            });
        });

        it("When getting new auth client, then the correct client is returned with proper configuration", () => {
            SdkManager.init(mockApiSecurity);
            const newAuthClient = SdkManager.instance.getNewAuth();
            expect(newAuthClient).toBeDefined();
            expect(Auth.client).toHaveBeenCalledWith(
                "https://test-drive-new-api.com",
                expect.any(Object),
                mockApiSecurity
            );
        });

        it("When getting users client, then the correct client is returned with proper configuration", () => {
            SdkManager.init(mockApiSecurity);
            const usersClient = SdkManager.instance.getUsers();
            expect(usersClient).toBeDefined();
            expect(Drive.Users.client).toHaveBeenCalledWith(
                "https://test-drive-new-api.com",
                expect.objectContaining({
                    clientName: "internxt-meet",
                    clientVersion: expect.any(String),
                }),
                expect.objectContaining({
                    token: "mock-new-token",
                    unauthorizedCallback: expect.any(Function),
                })
            );
        });

        it("When getting payments client, then the correct client is returned with proper configuration", () => {
            const getItemSpy = vi.spyOn(global.localStorage, "getItem");

            const paymentsClient = SdkManager.instance.getPayments();
            expect(paymentsClient).toBeDefined();

            expect(getItemSpy).toHaveBeenCalledWith("xNewToken");

            expect(Drive.Payments.client).toHaveBeenCalledWith(
                "https://test-payments-api.com",
                expect.any(Object),
                expect.objectContaining({
                    token: "mock-new-token",
                })
            );
        });

        it("When getting meet client, then the correct client is returned with proper configuration", () => {
            const getItemSpy = vi.spyOn(global.localStorage, "getItem");

            const meetClient = SdkManager.instance.getMeet();
            expect(meetClient).toBeDefined();

            expect(getItemSpy).toHaveBeenCalledWith("xNewToken");

            expect(Meet.client).toHaveBeenCalledWith(
                "https://test-meet-api.com",
                expect.any(Object),
                expect.objectContaining({
                    token: "mock-new-token",
                })
            );
        });

        it("When getting clients without api security, then Auth uses undefined and Users uses newToken security", () => {
            SdkManager.instance.getNewAuth();
            SdkManager.instance.getUsers();

            expect(Auth.client).toHaveBeenCalledWith(
                "https://test-drive-new-api.com",
                expect.objectContaining({
                    clientName: "internxt-meet",
                    clientVersion: expect.any(String),
                }),
                undefined
            );

            expect(Drive.Users.client).toHaveBeenCalledWith(
                "https://test-drive-new-api.com",
                expect.objectContaining({
                    clientName: "internxt-meet",
                    clientVersion: expect.any(String),
                }),
                expect.objectContaining({
                    token: "mock-new-token",
                    unauthorizedCallback: expect.any(Function),
                })
            );
        });

        it("Tests the unauthorizedCallback in getNewTokenApiSecurity", () => {
            SdkManager.instance.getPayments();
            const securityArg = (Drive.Payments.client as any).mock.calls[0][2];
            securityArg.unauthorizedCallback();
            expect(mockLocalStorage.clearCredentials).toHaveBeenCalled();
        });
    });
});
