import { beforeEach, describe, expect, it, vi } from "vitest";
import "../../__tests__/setup";
import { AuthService } from "../auth.service";
import { ConfigService } from "../config.service";
import {
    WEB_AUTH_CONFIG,
    WEB_AUTH_MESSAGE_TYPES,
    WEB_AUTH_STORAGE_KEYS,
    WebAuthMessage,
    WebAuthParams,
} from "../types/web-auth.types";
import { WebAuthService } from "../web-auth.service";

vi.mock("../auth.service");
vi.mock("../config.service");

describe("Web authentication service", () => {
    let service: WebAuthService;
    let mockAuthService: any;
    let mockConfigService: any;

    beforeEach(() => {
        vi.clearAllMocks();
        service = WebAuthService.instance;

        const localStorageMock = (() => {
            let store: Record<string, string> = {};

            return {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => {
                    store[key] = value.toString();
                },
                removeItem: (key: string) => {
                    delete store[key];
                },
                clear: () => {
                    store = {};
                },
            };
        })();

        Object.defineProperty(window, "localStorage", {
            value: localStorageMock,
            writable: true,
        });

        mockAuthService = {
            refreshUserAndTokens: vi.fn().mockResolvedValue({
                user: {
                    userId: "123",
                    email: "test@example.com",
                    name: "Test",
                    lastname: "User",
                },
            }),
        };
        (AuthService as any).instance = mockAuthService;

        mockConfigService = {
            isDevelopment: vi.fn().mockReturnValue(false),
        };
        (ConfigService as any).instance = mockConfigService;

        localStorage.clear();
    });

    describe("Authentication URLs", () => {
        it("when in production environment, then authentication URLs point to production domain", () => {
            mockConfigService.isDevelopment.mockReturnValue(false);

            const urls = service.urls;

            expect(urls.login).toBe(
                `https://drive.internxt.com${WEB_AUTH_CONFIG.loginPath}?${WEB_AUTH_CONFIG.authOriginParam}`
            );
            expect(urls.signup).toBe(
                `https://drive.internxt.com${WEB_AUTH_CONFIG.signupPath}?${WEB_AUTH_CONFIG.authOriginParam}`
            );
        });

        it("when in development environment, then authentication URLs point to localhost", () => {
            mockConfigService.isDevelopment.mockReturnValue(true);
            const devService = new (WebAuthService as any)();

            const urls = devService.urls;

            expect(urls.login).toContain("localhost:3000");
            expect(urls.login).toContain(WEB_AUTH_CONFIG.loginPath);
            expect(urls.login).toContain(WEB_AUTH_CONFIG.authOriginParam);
        });
    });

    describe("Processing authentication credentials", () => {
        it("when credentials are received, then the mnemonic is decoded from base64", async () => {
            const mnemonic = "test mnemonic phrase";
            const encodedMnemonic = Buffer.from(mnemonic).toString("base64");
            const encodedNewToken = Buffer.from("test-new-token").toString("base64");

            const params: WebAuthParams = {
                mnemonic: encodedMnemonic,
                newToken: encodedNewToken,
            };

            const result = await (service as any).processWebAuthParams(params);

            expect(result.mnemonic).toBe(mnemonic);
            expect(result.user.mnemonic).toBe(mnemonic);
        });

        it("when credentials are processed, then the token is stored in localStorage", async () => {
            const newToken = "test-new-token-value";
            const encodedNewToken = Buffer.from(newToken).toString("base64");
            const encodedMnemonic = Buffer.from("test mnemonic").toString("base64");

            const params: WebAuthParams = {
                mnemonic: encodedMnemonic,
                newToken: encodedNewToken,
            };

            await (service as any).processWebAuthParams(params);

            expect(localStorage.getItem(WEB_AUTH_STORAGE_KEYS.NEW_TOKEN)).toBe(newToken);
        });

        it("when credentials are stored, then user data is fetched from the API", async () => {
            const encodedNewToken = Buffer.from("test-new-token").toString("base64");
            const encodedMnemonic = Buffer.from("test mnemonic").toString("base64");

            const params: WebAuthParams = {
                mnemonic: encodedMnemonic,
                newToken: encodedNewToken,
            };

            await (service as any).processWebAuthParams(params);

            expect(mockAuthService.refreshUserAndTokens).toHaveBeenCalledTimes(1);
        });

        it("when credentials are fully processed, then complete authentication data is returned", async () => {
            const mnemonic = "test mnemonic phrase";
            const newToken = "test-new-token-value";
            const encodedMnemonic = Buffer.from(mnemonic).toString("base64");
            const encodedNewToken = Buffer.from(newToken).toString("base64");

            const params: WebAuthParams = {
                mnemonic: encodedMnemonic,
                newToken: encodedNewToken,
            };

            const result = await (service as any).processWebAuthParams(params);

            expect(result).toHaveProperty("user");
            expect(result).toHaveProperty("newToken", newToken);
            expect(result).toHaveProperty("mnemonic", mnemonic);
            expect(result.user).toHaveProperty("mnemonic", mnemonic);
        });

        it("when user data cannot be retrieved, then authentication fails with an error", async () => {
            mockAuthService.refreshUserAndTokens.mockRejectedValue(new Error("API Error"));

            const params: WebAuthParams = {
                mnemonic: Buffer.from("test").toString("base64"),
                newToken: Buffer.from("new-token").toString("base64"),
            };

            await expect((service as any).processWebAuthParams(params)).rejects.toThrow(
                "Web authentication processing failed"
            );
        });
    });

    describe("Validating authentication parameters", () => {
        it("when all required parameters are provided, then validation passes", () => {
            const params: WebAuthParams = {
                mnemonic: "test-mnemonic",
                newToken: "test-token",
            };

            const isValid = (service as any).validateAuthParams(params);

            expect(isValid).toBe(true);
        });

        it("when the mnemonic is missing, then validation fails", () => {
            const params = {
                newToken: "test-token",
            };

            const isValid = (service as any).validateAuthParams(params);

            expect(isValid).toBe(false);
        });

        it("when the token is missing, then validation fails", () => {
            const params = {
                mnemonic: "test-mnemonic",
            };

            const isValid = (service as any).validateAuthParams(params);

            expect(isValid).toBe(false);
        });

        it("when no parameters are provided, then validation fails", () => {
            const params = {};

            const isValid = (service as any).validateAuthParams(params);

            expect(isValid).toBe(false);
        });
    });

    describe("Origin security validation", () => {
        it("when the origin is from internxt.com domain, then it is accepted", () => {
            const isValid = (service as any).isValidOrigin("https://drive.internxt.com");

            expect(isValid).toBe(true);
        });

        it("when the origin is from localhost, then it is accepted", () => {
            const isValid = (service as any).isValidOrigin("http://localhost:3000");

            expect(isValid).toBe(true);
        });

        it("when the origin is from an unknown domain, then it is rejected", () => {
            const isValid = (service as any).isValidOrigin("https://malicious-site.com");

            expect(isValid).toBe(false);
        });

        it("when the origin is empty, then it is rejected", () => {
            const isValid = (service as any).isValidOrigin("");

            expect(isValid).toBe(false);
        });
    });

    describe("Handling authentication success messages", () => {
        it("when a success message with valid credentials is received, then authentication completes successfully", () => {
            const mockResolve = vi.fn();
            const mockReject = vi.fn();
            const mockTimeout = setTimeout(() => {}, 1000) as any;

            const payload: WebAuthParams = {
                mnemonic: "test-mnemonic",
                newToken: "test-token",
            };

            const message: WebAuthMessage = {
                type: WEB_AUTH_MESSAGE_TYPES.SUCCESS,
                payload,
            };

            (service as any).handleAuthSuccess(message, mockResolve, mockReject, mockTimeout);

            expect(mockResolve).toHaveBeenCalledWith(payload);
            expect(mockReject).not.toHaveBeenCalled();
        });

        it("when a success message has incomplete credentials, then authentication fails", () => {
            const mockResolve = vi.fn();
            const mockReject = vi.fn();
            const mockTimeout = setTimeout(() => {}, 1000) as any;

            const message: WebAuthMessage = {
                type: WEB_AUTH_MESSAGE_TYPES.SUCCESS,
                payload: { mnemonic: "test" } as any,
            };

            (service as any).handleAuthSuccess(message, mockResolve, mockReject, mockTimeout);

            expect(mockReject).toHaveBeenCalledWith(new Error("Missing authentication parameters"));
            expect(mockResolve).not.toHaveBeenCalled();
        });
    });

    describe("Handling authentication error messages", () => {
        it("when an error message with a description is received, then authentication fails with that error", () => {
            const mockReject = vi.fn();
            const mockTimeout = setTimeout(() => {}, 1000) as any;

            const message: WebAuthMessage = {
                type: WEB_AUTH_MESSAGE_TYPES.ERROR,
                error: "Authentication failed",
            };

            (service as any).handleAuthError(message, mockReject, mockTimeout);

            expect(mockReject).toHaveBeenCalledWith(new Error("Authentication failed"));
        });

        it("when an error message without a description is received, then authentication fails with a default error", () => {
            const mockReject = vi.fn();
            const mockTimeout = setTimeout(() => {}, 1000) as any;

            const message: WebAuthMessage = {
                type: WEB_AUTH_MESSAGE_TYPES.ERROR,
            };

            (service as any).handleAuthError(message, mockReject, mockTimeout);

            expect(mockReject).toHaveBeenCalledWith(new Error("Authentication failed"));
        });
    });

    describe("Token persistence", () => {
        it("when a token is stored, then it is saved in localStorage", () => {
            const newToken = "test-new-token-value";

            (service as any).storeTokens(newToken);

            expect(localStorage.getItem(WEB_AUTH_STORAGE_KEYS.NEW_TOKEN)).toBe(newToken);
        });

        it("when a new token is stored, then it replaces any existing token", () => {
            localStorage.setItem(WEB_AUTH_STORAGE_KEYS.NEW_TOKEN, "old-new-token");

            const newToken = "new-token-value";
            (service as any).storeTokens(newToken);

            expect(localStorage.getItem(WEB_AUTH_STORAGE_KEYS.NEW_TOKEN)).toBe(newToken);
        });
    });

    describe("Decoding base64 parameters", () => {
        it("when a base64-encoded string is received, then it is decoded to plain text", () => {
            const originalText = "test text with spaces";
            const encoded = Buffer.from(originalText).toString("base64");

            const decoded = (service as any).decodeBase64Param(encoded);

            expect(decoded).toBe(originalText);
        });

        it("when the encoded string contains special characters, then they are preserved after decoding", () => {
            const originalText = 'test!@#$%^&*()_+-=[]{}|;:",.<>?';
            const encoded = Buffer.from(originalText).toString("base64");

            const decoded = (service as any).decodeBase64Param(encoded);

            expect(decoded).toBe(originalText);
        });

        it("when the encoded string contains unicode characters, then they are preserved after decoding", () => {
            const originalText = "test émojis 😀🎉 and àccénts";
            const encoded = Buffer.from(originalText).toString("base64");

            const decoded = (service as any).decodeBase64Param(encoded);

            expect(decoded).toBe(originalText);
        });
    });

    describe("Popup window positioning", () => {
        it("when the popup is created, then it is centered on the screen", () => {
            Object.defineProperty(window, "screen", {
                value: {
                    width: 1920,
                    height: 1080,
                },
                writable: true,
            });

            const { left, top } = (service as any).calculatePopupPosition();

            const expectedLeft = 1920 / 2 - WEB_AUTH_CONFIG.popupWidth / 2;
            const expectedTop = 1080 / 2 - WEB_AUTH_CONFIG.popupHeight / 2;

            expect(left).toBe(expectedLeft);
            expect(top).toBe(expectedTop);
        });

        it("when the screen size changes, then the popup position is recalculated correctly", () => {
            Object.defineProperty(window, "screen", {
                value: {
                    width: 1366,
                    height: 768,
                },
                writable: true,
            });

            const { left, top } = (service as any).calculatePopupPosition();

            const expectedLeft = 1366 / 2 - WEB_AUTH_CONFIG.popupWidth / 2;
            const expectedTop = 768 / 2 - WEB_AUTH_CONFIG.popupHeight / 2;

            expect(left).toBe(expectedLeft);
            expect(top).toBe(expectedTop);
        });
    });

    describe("Popup window configuration", () => {
        it("when the popup window is configured, then it includes all required security and layout features", () => {
            const left = 100;
            const top = 200;

            const features = (service as any).buildPopupFeatures(left, top);

            expect(features).toContain(`width=${WEB_AUTH_CONFIG.popupWidth}`);
            expect(features).toContain(`height=${WEB_AUTH_CONFIG.popupHeight}`);
            expect(features).toContain(`left=${left}`);
            expect(features).toContain(`top=${top}`);
            expect(features).toContain("toolbar=no");
            expect(features).toContain("menubar=no");
            expect(features).toContain("location=no");
            expect(features).toContain("status=no");
        });
    });
});
