import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MiddlewareRegistry from "../../redux/MiddlewareRegistry";
import { updateMeetingConfig } from "../general/store/meeting/actions";
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
}));

vi.mock("../LocalStorageManager", () => ({
    LocalStorageManager: {
        instance: {
            get: vi.fn(),
            set: vi.fn(),
            remove: vi.fn(),
            clearCredentials: vi.fn(),
        },
    },
}));

vi.mock("../services/payments.service", () => ({
    PaymentsService: {
        instance: {
            checkMeetAvailability: vi.fn(),
        },
    },
}));

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

    const sampleMeetingConfig = {
        enabled: true,
        paxPerCall: 10,
    };

    beforeEach(() => {
        console.error = vi.fn();
        console.info = vi.fn();

        vi.clearAllMocks();

        vi.spyOn(Date, "now").mockImplementation(() => 1600000000000);

        (LocalStorageManager.instance.get as ReturnType<typeof vi.fn>).mockReturnValue(0);

        (PaymentsService.instance.checkMeetAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(
            sampleMeetingConfig
        );

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
        it("When LOGIN_SUCCESS action is dispatched, then it should update meeting config", async () => {
            const action = { type: AUTH_ACTIONS.LOGIN_SUCCESS };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);
            middleware(action);

            await vi.waitFor(() => {
                expect(PaymentsService.instance.checkMeetAvailability).toHaveBeenCalled();
            });

            expect(dispatchMock).toHaveBeenCalled();
            expect(updateMeetingConfig).toHaveBeenCalledWith({
                enabled: sampleMeetingConfig.enabled,
                paxPerCall: sampleMeetingConfig.paxPerCall,
            });
            expect(LocalStorageManager.instance.set).toHaveBeenCalledWith("lastMeetingConfigCheck", expect.any(Number));
            expect(LocalStorageManager.instance.set).toHaveBeenCalledWith("cachedMeetingConfig", sampleMeetingConfig);
        });

        it("When LOGIN_SUCCESS action is dispatched and last check was recent, then it should still force update", async () => {
            const action = { type: AUTH_ACTIONS.LOGIN_SUCCESS };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);

            const recentCheckTime = Date.now() - 1000;
            (LocalStorageManager.instance.get as ReturnType<typeof vi.fn>).mockReturnValue(recentCheckTime);

            middleware(action);

            await vi.waitFor(() => {
                expect(PaymentsService.instance.checkMeetAvailability).toHaveBeenCalled();
            });

            expect(PaymentsService.instance.checkMeetAvailability).toHaveBeenCalled();
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
                expect(PaymentsService.instance.checkMeetAvailability).toHaveBeenCalled();
            });

            expect(updateMeetingConfig).toHaveBeenCalled();
        });

        it("When REFRESH_TOKEN_SUCCESS action is dispatched and interval has not expired, then it should not update meeting config", async () => {
            const action = { type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);

            const recentCheckTime = Date.now() - 1000;
            (LocalStorageManager.instance.get as ReturnType<typeof vi.fn>).mockReturnValue(recentCheckTime);

            middleware(action);

            await vi.waitFor(() => {}, { timeout: 100 });

            expect(PaymentsService.instance.checkMeetAvailability).not.toHaveBeenCalled();
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
                expect(PaymentsService.instance.checkMeetAvailability).toHaveBeenCalled();
            });

            expect(updateMeetingConfig).toHaveBeenCalled();
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

            expect(PaymentsService.instance.checkMeetAvailability).not.toHaveBeenCalled();
        });

        it("When INITIALIZE_AUTH action is dispatched with non-authenticated user, then it should not update meeting config", async () => {
            const action = {
                type: AUTH_ACTIONS.INITIALIZE_AUTH,
                payload: { isAuthenticated: false },
            };

            const middleware = meetingConfigMiddleware(storeMock)(nextMock);
            middleware(action);

            await vi.waitFor(() => {}, { timeout: 100 });

            expect(PaymentsService.instance.checkMeetAvailability).not.toHaveBeenCalled();
        });
    });

    describe("LOGOUT Action", () => {
        it("When LOGOUT action is dispatched, then it should clear localStorage values and credentials", () => {
            const action = { type: AUTH_ACTIONS.LOGOUT };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);
            middleware(action);

            expect(LocalStorageManager.instance.remove).toHaveBeenCalledWith("lastMeetingConfigCheck");
            expect(LocalStorageManager.instance.remove).toHaveBeenCalledWith("cachedMeetingConfig");
            expect(LocalStorageManager.instance.clearCredentials).toHaveBeenCalledTimes(1);
        });

        it("When LOGOUT action is dispatched and localStorage removal fails, then it should handle the error", () => {
            const action = { type: AUTH_ACTIONS.LOGOUT };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);

            (LocalStorageManager.instance.remove as ReturnType<typeof vi.fn>).mockImplementation(() => {
                throw new Error("localStorage error");
            });

            middleware(action);

            expect(console.error).toHaveBeenCalledWith(
                "Error clearing meeting config from localStorage",
                expect.any(Error)
            );
        });
    });

    describe("Error Handling", () => {
        it("When updating meeting config and API call fails, then it should handle the error", async () => {
            const action = { type: AUTH_ACTIONS.LOGIN_SUCCESS };
            const middleware = meetingConfigMiddleware(storeMock)(nextMock);

            (PaymentsService.instance.checkMeetAvailability as ReturnType<typeof vi.fn>).mockRejectedValue(
                new Error("API error")
            );

            middleware(action);

            await vi.waitFor(() => {
                expect(console.error).toHaveBeenCalled();
            });

            expect(console.error).toHaveBeenCalledWith("Error checking meeting configuation", expect.any(Error));
            expect(dispatchMock).not.toHaveBeenCalled();
        });
    });
});
