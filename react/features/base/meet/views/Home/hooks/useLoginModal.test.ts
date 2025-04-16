import { act, renderHook } from "@testing-library/react";
import { useDispatch } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { get8x8BetaJWT } from "../../../../connection/options8x8";
import "../../../__tests__/setup";
import { setRoomID } from "../../../general/store/errors/actions";
import { useLocalStorage } from "../../../LocalStorageManager";
import { AuthService } from "../../../services/auth.service";
import { useLoginModal } from "./useLoginModal";

vi.mock("../../../services/auth.service");
vi.mock("../../../../connection/options8x8");
vi.mock("../../../LocalStorageManager");
vi.mock("react-redux", () => ({
    useDispatch: vi.fn(),
}));
vi.mock("../../../general/store/errors/actions", () => ({
    setRoomID: vi.fn(),
}));
vi.mock("react-hook-form", () => ({
    useForm: () => ({
        register: vi.fn(),
        formState: { errors: {} },
        handleSubmit: vi.fn(),
        reset: vi.fn(),
        watch: vi.fn(() => ""),
    }),
}));

describe("useLoginModal", () => {
    const mockOnClose = vi.fn();
    const mockOnLogin = vi.fn();
    const mockTranslate = vi.fn((key) => key);
    const mockSaveCredentials = vi.fn();
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useLocalStorage as any).mockReturnValue({
            saveCredentials: mockSaveCredentials,
        });
        (useDispatch as any).mockReturnValue(mockDispatch);
        (setRoomID as any).mockReturnValue({ type: "SET_ROOM_ID" });
    });

    describe("Initial state", () => {
        it("When the modal is initialized, then it has default values", () => {
            const { result } = renderHook(() =>
                useLoginModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            expect(result.current.isLoggingIn).toBe(false);
            expect(result.current.showTwoFactor).toBe(false);
            expect(result.current.loginError).toBe("");
        });
    });

    describe("Login process", () => {
        it("When logging in with valid credentials without 2FA, then the login completes successfully", async () => {
            const mockCredentials = {
                newToken: "new-token",
                user: { id: 1 },
                token: "token",
                mnemonic: "mnemonic",
            };
            const mockMeetToken = {
                token: "meet-token",
                room: "room-id",
            };

            (AuthService.instance.doLogin as any).mockResolvedValue(mockCredentials);
            (AuthService.instance.is2FANeeded as any).mockResolvedValue(false);
            (get8x8BetaJWT as any).mockResolvedValue(mockMeetToken);

            const { result } = renderHook(() =>
                useLoginModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            await act(async () => {
                await result.current.handleLogin({
                    email: "test@example.com",
                    password: "password",
                    twoFactorCode: "",
                });
            });

            expect(mockSaveCredentials).toHaveBeenCalledWith(
                mockCredentials.token,
                mockCredentials.newToken,
                mockCredentials.mnemonic,
                mockCredentials.user
            );
            expect(mockDispatch).toHaveBeenCalledWith({ type: "SET_ROOM_ID" });
            expect(setRoomID).toHaveBeenCalledWith("room-id");
            expect(mockOnLogin).toHaveBeenCalledWith(mockCredentials.newToken);
            expect(mockOnClose).toHaveBeenCalled();
        });

        it("When 2FA is enabled for the user, then the 2FA screen is displayed", async () => {
            (AuthService.instance.is2FANeeded as any).mockResolvedValue(true);

            const { result } = renderHook(() =>
                useLoginModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            await act(async () => {
                await result.current.handleLogin({
                    email: "test@example.com",
                    password: "password",
                    twoFactorCode: "",
                });
            });

            expect(result.current.showTwoFactor).toBe(true);
            expect(mockOnLogin).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe("Error handling", () => {
        it("When authenticateUser throws invalidCredentials error, then the error message is displayed", async () => {
            // Mock doLogin to throw an error
            (AuthService.instance.doLogin as any).mockRejectedValue(new Error("Any error"));
            (AuthService.instance.is2FANeeded as any).mockResolvedValue(false);

            // Make translate return the expected error key
            mockTranslate.mockImplementation((key) => {
                if (key === "meet.auth.modal.error.invalidCredentials") {
                    return "meet.auth.modal.error.invalidCredentials";
                }
                return key;
            });

            const { result } = renderHook(() =>
                useLoginModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            await act(async () => {
                await result.current.handleLogin({
                    email: "test@example.com",
                    password: "wrong-password",
                    twoFactorCode: "",
                });
            });

            expect(result.current.loginError).toBe("meet.auth.modal.error.invalidCredentials");
            expect(mockOnLogin).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it("When createMeetToken throws cannotCreateMeetings error, then the error message is displayed", async () => {
            const mockCredentials = {
                newToken: "new-token",
                user: { id: 1 },
                token: "token",
                mnemonic: "mnemonic",
            };

            (AuthService.instance.doLogin as any).mockResolvedValue(mockCredentials);
            (AuthService.instance.is2FANeeded as any).mockResolvedValue(false);
            (get8x8BetaJWT as any).mockRejectedValue(new Error("Failed to create meet token"));

            // Make translate return the expected error key
            mockTranslate.mockImplementation((key) => {
                if (key === "meet.auth.modal.error.cannotCreateMeetings") {
                    return "meet.auth.modal.error.cannotCreateMeetings";
                }
                return key;
            });

            const { result } = renderHook(() =>
                useLoginModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            await act(async () => {
                await result.current.handleLogin({
                    email: "test@example.com",
                    password: "password",
                    twoFactorCode: "",
                });
            });

            expect(result.current.loginError).toBe("meet.auth.modal.error.cannotCreateMeetings");
            expect(mockOnLogin).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it("When login credentials are invalid or incomplete, then an error message is displayed", async () => {
            const mockCredentials = {
                token: "token",
                mnemonic: "mnemonic",
            };

            (AuthService.instance.doLogin as any).mockResolvedValue(mockCredentials);
            (AuthService.instance.is2FANeeded as any).mockResolvedValue(false);

            mockTranslate.mockImplementation((key) => {
                if (key === "meet.auth.modal.error.invalidCredentials") {
                    return "meet.auth.modal.error.invalidCredentials";
                }
                return key;
            });

            const { result } = renderHook(() =>
                useLoginModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            await act(async () => {
                await result.current.handleLogin({
                    email: "test@example.com",
                    password: "password",
                    twoFactorCode: "",
                });
            });

            expect(result.current.loginError).toBe("meet.auth.modal.error.invalidCredentials");
            expect(mockOnLogin).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it("When meet data is invalid or incomplete, then an error message is displayed", async () => {
            const mockCredentials = {
                newToken: "new-token",
                user: { id: 1 },
                token: "token",
                mnemonic: "mnemonic",
            };

            const invalidMeetData = {
                token: "meet-token",
            };

            (AuthService.instance.doLogin as any).mockResolvedValue(mockCredentials);
            (AuthService.instance.is2FANeeded as any).mockResolvedValue(false);
            (get8x8BetaJWT as any).mockResolvedValue(invalidMeetData);

            mockTranslate.mockImplementation((key) => {
                if (key === "meet.auth.modal.error.cannotCreateMeetings") {
                    return "meet.auth.modal.error.cannotCreateMeetings";
                }
                return key;
            });

            const { result } = renderHook(() =>
                useLoginModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            await act(async () => {
                await result.current.handleLogin({
                    email: "test@example.com",
                    password: "password",
                    twoFactorCode: "",
                });
            });

            expect(result.current.loginError).toBe("meet.auth.modal.error.cannotCreateMeetings");
            expect(mockOnLogin).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it("When an unknown error occurs, then a generic error message is displayed", async () => {
            (AuthService.instance.is2FANeeded as any).mockRejectedValue("Unknown error");

            mockTranslate.mockImplementation((key) => {
                if (key === "meet.auth.modal.error.genericError") {
                    return "meet.auth.modal.error.genericError";
                }
                return key;
            });

            const { result } = renderHook(() =>
                useLoginModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            await act(async () => {
                await result.current.handleLogin({
                    email: "test@example.com",
                    password: "password",
                    twoFactorCode: "",
                });
            });

            expect(result.current.loginError).toBe("meet.auth.modal.error.genericError");
            expect(mockOnLogin).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe("State management", () => {
        it("When resetState is called, then all state values are reset to default", () => {
            const { result } = renderHook(() =>
                useLoginModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            act(() => {
                result.current.resetState();
            });

            expect(result.current.showTwoFactor).toBe(false);
            expect(result.current.loginError).toBe("");
        });
    });
});
