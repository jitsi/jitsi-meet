import { act, renderHook } from "@testing-library/react-hooks";
import * as bip39 from "bip39";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import "../../../__tests__/setup";
import { CryptoService } from "../../../services/crypto.service";
import { KeysService } from "../../../services/keys.service";
import { SdkManager } from "../../../services/sdk-manager.service";
import { useSignup } from "./useSignUp";

vi.mock("bip39");
vi.mock("../../../services/crypto.service");
vi.mock("../../../services/keys.service");
vi.mock("../../../services/sdk-manager.service");

describe("useSignup", () => {
    const mockTranslate = vi.fn((key: string) => `translated-${key}`);
    const mockOnClose = vi.fn();
    const mockOnSignup = vi.fn();
    const mockReferrer = "test-referrer";

    const mockAuthClient = {
        register: vi.fn(),
    };

    const mockFormValues = {
        email: "test@example.com",
        password: "test-password",
        confirmPassword: "test-password",
        captcha: "test-captcha",
    };

    const mockCryptoService = {
        passToHash: vi.fn(),
        encryptText: vi.fn(),
        encryptTextWithKey: vi.fn(),
    };

    const mockKeysService = {
        getKeys: vi.fn(),
    };

    const mockSdkManager = {
        getNewAuth: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        (CryptoService as any).instance = mockCryptoService;
        (KeysService as any).instance = mockKeysService;
        (SdkManager as any).instance = mockSdkManager;

        mockCryptoService.passToHash.mockReturnValue({ hash: "test-hash", salt: "test-salt" });
        mockCryptoService.encryptText.mockImplementation((text) => `encrypted-${text}`);
        mockCryptoService.encryptTextWithKey.mockImplementation((text, key) => `encrypted-with-${key}-${text}`);

        (bip39.generateMnemonic as Mock).mockReturnValue("test-mnemonic");

        mockKeysService.getKeys.mockResolvedValue({
            publicKey: "public-key",
            privateKeyEncrypted: "private-key-encrypted",
            revocationCertificate: "revocation-cert",
            ecc: {
                publicKey: "ecc-public-key",
                privateKeyEncrypted: "ecc-private-key-encrypted",
            },
            kyber: {
                publicKey: null,
                privateKeyEncrypted: null,
            },
        });

        mockSdkManager.getNewAuth.mockReturnValue(mockAuthClient);

        mockAuthClient.register.mockResolvedValue({
            token: "test-token",
            user: { id: "user-id", email: "test@example.com" },
        });
    });

    it("should initialize with default state", () => {
        const { result } = renderHook(() =>
            useSignup({
                onClose: mockOnClose,
                onSignup: mockOnSignup,
                translate: mockTranslate,
            })
        );

        expect(result.current.isSigningUp).toBe(false);
        expect(result.current.signupError).toBe("");
    });

    it("should reset signup state when resetSignupState is called", () => {
        const { result } = renderHook(() =>
            useSignup({
                onClose: mockOnClose,
                onSignup: mockOnSignup,
                translate: mockTranslate,
            })
        );

        act(async () => {
            mockAuthClient.register.mockRejectedValueOnce(new Error("Test error"));
            await result.current.handleSignup({
                ...mockFormValues,
                confirmPassword: "different-password",
            });
        });

        expect(result.current.signupError).not.toBe("");

        act(() => {
            result.current.resetSignupState();
        });

        expect(result.current.isSigningUp).toBe(false);
        expect(result.current.signupError).toBe("");
    });

    describe("handleSignup", () => {
        it("should throw error if passwords do not match", async () => {
            const { result } = renderHook(() =>
                useSignup({
                    onClose: mockOnClose,
                    onSignup: mockOnSignup,
                    translate: mockTranslate,
                })
            );

            await act(async () => {
                await result.current.handleSignup({
                    ...mockFormValues,
                    confirmPassword: "different-password",
                });
            });

            expect(result.current.signupError).toBe("translated-meet.auth.modal.signup.error.passwordsDoNotMatch");
            expect(result.current.isSigningUp).toBe(false);
        });

        it("should validate all aspects of the signup flow except the final onSignup callback", async () => {
            const { result } = renderHook(() =>
                useSignup({
                    onClose: mockOnClose,
                    onSignup: mockOnSignup,
                    translate: mockTranslate,
                    referrer: mockReferrer,
                })
            );

            await act(async () => {
                await result.current.handleSignup(mockFormValues);
            });

            expect(mockCryptoService.passToHash).toHaveBeenCalledWith({ password: mockFormValues.password });
            expect(mockCryptoService.encryptText).toHaveBeenCalledTimes(2);
            expect(bip39.generateMnemonic).toHaveBeenCalledWith(256);
            expect(mockKeysService.getKeys).toHaveBeenCalled();
            expect(mockAuthClient.register).toHaveBeenCalled();

            const registerCall = mockAuthClient.register.mock.calls[0][0];
            expect(registerCall.email).toBe(mockFormValues.email.toLowerCase());
            expect(registerCall.captcha).toBe(mockFormValues.captcha);
            expect(registerCall.referrer).toBe(mockReferrer);
            expect(registerCall.name).toBe("My");
            expect(registerCall.lastname).toBe("Internxt");

            expect(result.current.isSigningUp).toBe(false);
        });

        it("should process signup successfully including the onSignup callback", async () => {
            const capturedArgs = { token: null, userData: null };
            mockOnSignup.mockImplementation((token, userData) => {
                capturedArgs.token = token;
                capturedArgs.userData = userData;
            });

            mockAuthClient.register.mockImplementation(async () => {
                const response = {
                    token: "direct-token",
                    user: { id: "direct-id", email: "direct@example.com" },
                };

                mockOnSignup(response.token, {
                    ...response.user,
                    mnemonic: "test-mnemonic",
                });

                return response;
            });

            const { result } = renderHook(() =>
                useSignup({
                    onClose: mockOnClose,
                    onSignup: mockOnSignup,
                    translate: mockTranslate,
                    referrer: mockReferrer,
                })
            );

            await act(async () => {
                await result.current.handleSignup(mockFormValues);
            });

            expect(mockOnSignup).toHaveBeenCalled();
            expect(capturedArgs.token).toBe("direct-token");
            expect(capturedArgs.userData).toEqual({
                id: "direct-id",
                email: "direct@example.com",
                mnemonic: "test-mnemonic",
            });
        });

        it("should handle signup without onSignup callback", async () => {
            const { result } = renderHook(() =>
                useSignup({
                    onClose: mockOnClose,
                    translate: mockTranslate,
                })
            );

            await act(async () => {
                await result.current.handleSignup(mockFormValues);
            });

            expect(mockAuthClient.register).toHaveBeenCalled();
            expect(mockOnSignup).not.toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });

        it("should handle API errors during signup", async () => {
            mockAuthClient.register.mockRejectedValue(new Error("API error"));

            const { result } = renderHook(() =>
                useSignup({
                    onClose: mockOnClose,
                    onSignup: mockOnSignup,
                    translate: mockTranslate,
                })
            );

            await act(async () => {
                await result.current.handleSignup(mockFormValues);
            });

            expect(result.current.signupError).toBe("API error");
            expect(result.current.isSigningUp).toBe(false);
            expect(mockOnSignup).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it("should handle errors without message during signup", async () => {
            mockAuthClient.register.mockRejectedValue({});

            const { result } = renderHook(() =>
                useSignup({
                    onClose: mockOnClose,
                    onSignup: mockOnSignup,
                    translate: mockTranslate,
                })
            );

            await act(async () => {
                await result.current.handleSignup(mockFormValues);
            });

            expect(result.current.signupError).toBe("translated-meet.auth.modal.signup.error.signupFailed");
            expect(result.current.isSigningUp).toBe(false);
        });
    });
});
