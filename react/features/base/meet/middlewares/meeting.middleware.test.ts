import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MiddlewareRegistry from "../../redux/MiddlewareRegistry";
import { setPlanName, setUserTier, updateMeetingConfig } from "../general/store/meeting/actions";
import { MEETING_REDUCER } from "../general/store/meeting/reducer";
import { LocalStorageManager } from "../LocalStorageManager";
import { PaymentsService } from "../services/payments.service";
import { AUTH_ACTIONS, meetingConfigMiddleware } from "./meeting.middleware";

vi.mock("../../redux/MiddlewareRegistry", () => ({
    default: {
        register: vi.fn(),
    },
}));

vi.mock("../general/store/meeting/actions", () => ({
    updateMeetingConfig: vi.fn((config) => ({
        type: "UPDATE_MEETING_CONFIG",
        payload: config,
    })),
    setPlanName: vi.fn((planName) => ({
        type: "SET_PLAN_NAME",
        payload: { planName },
    })),
    setUserTier: vi.fn((userTier) => ({
        type: "SET_USER_TIER",
        payload: { userTier },
    })),
}));

vi.mock("../LocalStorageManager", () => {
    const mockInstance = {
        get: vi.fn(),
        set: vi.fn(),
        clearStorage: vi.fn(),
        clearCredentials: vi.fn(),
        getUser: vi.fn(),
        getToken: vi.fn(),
    };
    return {
        default: mockInstance,
        LocalStorageManager: { instance: mockInstance },
        STORAGE_KEYS: {
            LAST_CONFIG_CHECK: "lastMeetingConfigCheck",
            CACHED_MEETING_CONFIG: "cachedMeetingConfig",
            LAST_USER_REFRESH: "lastUserRefresh",
        },
    };
});

vi.mock("../services/payments.service", () => ({
    PaymentsService: {
        instance: {
            getUserTier: vi.fn(),
            checkMeetAvailability: vi.fn(),
        },
    },
}));

// TODO: UNCOMMENT COMMENTED TESTS WHEN MEET BACKEND IS READY
describe("meetingConfigMiddleware", () => {
    const originalConsoleError = console.error;
    const originalConsoleInfo = console.info;

    const dispatchMock = vi.fn();
    const nextMock = vi.fn((action) => action);
    const getStateMock = vi.fn();
    const storeMock = {
        dispatch: dispatchMock,
        getState: getStateMock,
    };

    const sampleUserTier = {
        id: "tier-123",
        label: "premium",
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

    beforeEach(() => {
        console.error = vi.fn();
        console.info = vi.fn();

        vi.clearAllMocks();

        vi.spyOn(Date, "now").mockImplementation(() => 1600000000000);

        (LocalStorageManager.instance.get as ReturnType<typeof vi.fn>).mockReturnValue(0);

        (PaymentsService.instance.getUserTier as ReturnType<typeof vi.fn>).mockResolvedValue(sampleUserTier);

        getStateMock.mockReturnValue({
            [MEETING_REDUCER]: {
                enabled: false,
            },
        });
    });

    afterEach(() => {
        console.error = originalConsoleError;
        console.info = originalConsoleInfo;
    });

    describe("Middleware Registration", () => {
        it("When middleware is initialized, then it should register with MiddlewareRegistry", () => {
            MiddlewareRegistry.register(meetingConfigMiddleware);
            expect(MiddlewareRegistry.register).toHaveBeenCalledWith(meetingConfigMiddleware);
        });
    });

    describe("Action Handling", () => {
        it("When any action is passed, then it should pass the action to next middleware", () => {
            const action = { type: "TEST_ACTION" };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);
            middleware(action);
            expect(nextMock).toHaveBeenCalledWith(action);
        });
    });

    describe("LOGIN_SUCCESS Action", () => {
        it("When LOGIN_SUCCESS action is dispatched, then it should update meeting config and plan name", async () => {
            const action = { type: AUTH_ACTIONS.LOGIN_SUCCESS };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);
            middleware(action);

            await vi.waitFor(() => {
                expect(PaymentsService.instance.getUserTier).toHaveBeenCalled();
            });

            expect(PaymentsService.instance.getUserTier).toHaveBeenCalledTimes(1);
            expect(updateMeetingConfig).toHaveBeenCalledWith({
                enabled: true,
                paxPerCall: 10,
            });
            expect(setPlanName).toHaveBeenCalledWith("premium");
            expect(setUserTier).toHaveBeenCalledWith(sampleUserTier);
            expect(LocalStorageManager.instance.set).toHaveBeenCalledWith("lastMeetingConfigCheck", expect.any(Number));
        });

        it("When LOGIN_SUCCESS action is dispatched and last check was recent, then it should still force update", async () => {
            const action = { type: AUTH_ACTIONS.LOGIN_SUCCESS };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);

            const recentCheckTime = Date.now() - 1000;
            (LocalStorageManager.instance.get as ReturnType<typeof vi.fn>).mockReturnValue(recentCheckTime);

            middleware(action);

            await vi.waitFor(() => {
                expect(PaymentsService.instance.getUserTier).toHaveBeenCalled();
            });

            expect(PaymentsService.instance.getUserTier).toHaveBeenCalled();
        });
    });

    describe("REFRESH_TOKEN_SUCCESS Action", () => {
        it("When REFRESH_TOKEN_SUCCESS action is dispatched and interval has expired, then it should update meeting config", async () => {
            const action = { type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);

            const oldCheckTime = Date.now() - 61 * 60 * 1000;
            (LocalStorageManager.instance.get as ReturnType<typeof vi.fn>).mockReturnValue(oldCheckTime);

            middleware(action);

            await vi.waitFor(() => {
                expect(PaymentsService.instance.getUserTier).toHaveBeenCalled();
            });

            expect(updateMeetingConfig).toHaveBeenCalled();
            expect(setPlanName).toHaveBeenCalled();
            expect(setUserTier).toHaveBeenCalled();
        });

        it("When REFRESH_TOKEN_SUCCESS action is dispatched and interval has not expired, then it should not update meeting config", async () => {
            const action = { type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);

            const recentCheckTime = Date.now() - 1000;
            (LocalStorageManager.instance.get as ReturnType<typeof vi.fn>).mockReturnValue(recentCheckTime);

            middleware(action);

            await vi.waitFor(() => {}, { timeout: 100 });

            expect(PaymentsService.instance.getUserTier).not.toHaveBeenCalled();
        });
    });

    describe("INITIALIZE_AUTH Action", () => {
        it("When INITIALIZE_AUTH action is dispatched with authenticated user and meeting not enabled, then it should force update", async () => {
            const action = {
                type: AUTH_ACTIONS.INITIALIZE_AUTH,
                payload: { isAuthenticated: true },
            };

            getStateMock.mockReturnValue({
                [MEETING_REDUCER]: {
                    enabled: false,
                },
            });

            const middleware = meetingConfigMiddleware(storeMock)(nextMock);
            middleware(action);

            await vi.waitFor(() => {
                expect(PaymentsService.instance.getUserTier).toHaveBeenCalled();
            });

            expect(updateMeetingConfig).toHaveBeenCalled();
            expect(setPlanName).toHaveBeenCalled();
            expect(setUserTier).toHaveBeenCalled();
        });

        it("When INITIALIZE_AUTH action is dispatched with authenticated user, meeting enabled, and interval not expired, then it should not update", async () => {
            const action = {
                type: AUTH_ACTIONS.INITIALIZE_AUTH,
                payload: { isAuthenticated: true },
            };

            getStateMock.mockReturnValue({
                [MEETING_REDUCER]: {
                    enabled: true,
                },
            });

            const middleware = meetingConfigMiddleware(storeMock)(nextMock);

            const recentCheckTime = Date.now() - 1000;
            (LocalStorageManager.instance.get as ReturnType<typeof vi.fn>).mockReturnValue(recentCheckTime);

            middleware(action);

            await vi.waitFor(() => {}, { timeout: 100 });

            expect(PaymentsService.instance.getUserTier).not.toHaveBeenCalled();
        });

        it("When INITIALIZE_AUTH action is dispatched with non-authenticated user, then it should not update meeting config", async () => {
            const action = {
                type: AUTH_ACTIONS.INITIALIZE_AUTH,
                payload: { isAuthenticated: false },
            };

            const middleware = meetingConfigMiddleware(storeMock)(nextMock);
            middleware(action);

            await vi.waitFor(() => {}, { timeout: 100 });

            expect(PaymentsService.instance.getUserTier).not.toHaveBeenCalled();
        });
    });

    describe("LOGOUT Action", () => {
        it("When LOGOUT action is dispatched, then it should clear storage and credentials", () => {
            const action = { type: AUTH_ACTIONS.LOGOUT };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);
            middleware(action);

            expect(LocalStorageManager.instance.clearCredentials).toHaveBeenCalledTimes(1);
        });

        it("When LOGOUT action is dispatched and clearStorage fails, then it should handle the error", () => {
            const action = { type: AUTH_ACTIONS.LOGOUT };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);

            vi.spyOn(LocalStorageManager.instance, 'clearStorage' as any).mockImplementation(() => {
                throw new Error("localStorage error");
            });

            middleware(action);

            expect(console.error).toHaveBeenCalledWith(
                "Error clearing cached data from localStorage",
                expect.any(Error)
            );
        });
    });

    describe("Error Handling", () => {
        it("When updating meeting config and API call fails, then it should handle the error", async () => {
            const action = { type: AUTH_ACTIONS.LOGIN_SUCCESS };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);

            (PaymentsService.instance.getUserTier as ReturnType<typeof vi.fn>).mockRejectedValue(
                new Error("API error")
            );

            middleware(action);

            await vi.waitFor(() => {
                expect(console.error).toHaveBeenCalled();
            });

            expect(console.error).toHaveBeenCalledWith("Error checking meeting configuration", expect.any(Error));
        });
    });
});
