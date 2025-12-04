import { UserSettings } from "@internxt/sdk/dist/shared/types/userSettings";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageManager } from "../../../../LocalStorageManager";
import { AUTH_ACTIONS } from "../../../../middlewares";
import { initializeAuth, loginSuccess, logout, refreshTokenSuccess } from "../actions";

vi.mock("../../../../LocalStorageManager", () => {
    const mockInstance = {
        getNewToken: vi.fn(),
    };

    return {
        LocalStorageManager: {
            instance: mockInstance,
        },
        default: {
            instance: mockInstance,
        },
    };
});

describe("Authentication Actions", () => {
    const dispatchMock = vi.fn();
    const getStateMock = vi.fn();
    const extraArg = undefined;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("initializeAuth", () => {
        it("When user has token, then it should dispatch INITIALIZE_AUTH with isAuthenticated=true", () => {
            const mockToken = "valid-token-123";
            (LocalStorageManager.instance.getNewToken as any).mockReturnValue(mockToken);

            initializeAuth()(dispatchMock, getStateMock, extraArg);

            expect(dispatchMock).toHaveBeenCalledWith({
                type: AUTH_ACTIONS.INITIALIZE_AUTH,
                payload: {
                    isAuthenticated: true,
                    token: mockToken,
                },
            });
        });

        it("When user has no token, then it should dispatch INITIALIZE_AUTH with isAuthenticated=false", () => {
            (LocalStorageManager.instance.getNewToken as any).mockReturnValue(null);

            initializeAuth()(dispatchMock, getStateMock, extraArg);

            expect(dispatchMock).toHaveBeenCalledWith({
                type: AUTH_ACTIONS.INITIALIZE_AUTH,
                payload: {
                    isAuthenticated: false,
                    token: null,
                },
            });
        });

        it("When token is empty string, then it should be treated as not authenticated", () => {
            (LocalStorageManager.instance.getNewToken as any).mockReturnValue("");

            initializeAuth()(dispatchMock, getStateMock, extraArg);

            expect(dispatchMock).toHaveBeenCalledWith({
                type: AUTH_ACTIONS.INITIALIZE_AUTH,
                payload: {
                    isAuthenticated: false,
                    token: null,
                },
            });
        });
    });

    describe("loginSuccess", () => {
        it("When called with credentials, then it should return the correct action", () => {
            const mockCredentials = {
                newToken: "new-token-123",
                mnemonic: "mock-mnemonic",
                user: { id: "user123", name: "Test User" } as unknown as UserSettings,
            };

            const result = loginSuccess(mockCredentials);

            expect(result).toEqual({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                    token: mockCredentials.newToken,
                    user: mockCredentials.user,
                },
            });
        });
    });

    describe("logout", () => {
        it("When called, then it should return the correct action", () => {
            const result = logout();

            expect(result).toEqual({
                type: AUTH_ACTIONS.LOGOUT,
            });
        });
    });

    describe("refreshTokenSuccess", () => {
        it("When called with token data, then it should return the correct action", () => {
            const mockData = {
                token: "refreshed-token-456",
            };

            const result = refreshTokenSuccess(mockData);

            expect(result).toEqual({
                type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS,
                payload: {
                    token: mockData.token,
                },
            });
        });
    });
});
