import { AnyAction, Dispatch, Middleware } from "redux";

import MiddlewareRegistry from "../../redux/MiddlewareRegistry";
import { updateMeetingConfig } from "../general/store/meeting/actions";
import { MEETING_REDUCER } from "../general/store/meeting/reducer";
import { LocalStorageManager } from "../LocalStorageManager";
import { PaymentsService } from "../services/payments.service";

/**
 * Constants for auth-related action types.
 */
export const AUTH_ACTIONS = {
    LOGIN_SUCCESS: "features/authentication/LOGIN_SUCCESS",
    LOGOUT: "features/authentication/LOGOUT",
    REFRESH_TOKEN_SUCCESS: "features/authentication/REFRESH_TOKEN_SUCCESS",
    INITIALIZE_AUTH: "features/authentication/INITIALIZE",
};

/**
 * Minimum interval between configuration checks (in ms).
 * Default: 1 hour
 */
const CONFIG_CHECK_INTERVAL = 60 * 60 * 1000;

/**
 * Key for storing the last configuration check timestamp in localStorage.
 */
const LAST_CONFIG_CHECK_KEY = "lastMeetingConfigCheck";

/**
 * Key for storing the cached meeting configuration in localStorage.
 */
const CACHED_MEETING_CONFIG_KEY = "cachedMeetingConfig";

/**
 * Middleware for automatically managing meeting configuration.
 */
const meetingConfigMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);

    switch (action.type) {
        case AUTH_ACTIONS.LOGIN_SUCCESS:
            updateUserMeetingConfig(store.dispatch, true);
            break;

        case AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS:
            updateUserMeetingConfig(store.dispatch);
            break;

        case AUTH_ACTIONS.INITIALIZE_AUTH:
            if (action.payload && action.payload.isAuthenticated) {
                const meetingState = store.getState()[MEETING_REDUCER];

                if (!meetingState.enabled) {
                    updateUserMeetingConfig(store.dispatch, true);
                } else {
                    updateUserMeetingConfig(store.dispatch);
                }
            }
            break;

        case AUTH_ACTIONS.LOGOUT:
            try {
                LocalStorageManager.instance.remove(LAST_CONFIG_CHECK_KEY);
                LocalStorageManager.instance.remove(CACHED_MEETING_CONFIG_KEY);
            } catch (error) {
                console.error("Error clearing meeting config from localStorage", error);
            }
            break;

        default:
            break;
    }

    return result;
};

/**
 * Updates the user's meeting configuration
 *
 * @param dispatch - Redux dispatch function
 * @param force - Force update even if the interval hasn't passed
 * @returns Promise<void>
 */
const updateUserMeetingConfig = async (dispatch: Dispatch<AnyAction>, force: boolean = false): Promise<void> => {
    try {
        const now = Date.now();
        const lastCheckTime = LocalStorageManager.instance.get<number>(LAST_CONFIG_CHECK_KEY, 0) ?? 0;
        const hasExpiredVerificationInterval = now - lastCheckTime > CONFIG_CHECK_INTERVAL;

        if (force || hasExpiredVerificationInterval) {
            try {
                const meetingConfig = await PaymentsService.instance.checkMeetAvailability();
                const { enabled, paxPerCall } = meetingConfig;
                dispatch(updateMeetingConfig({ enabled, paxPerCall }));

                LocalStorageManager.instance.set(LAST_CONFIG_CHECK_KEY, now);
                LocalStorageManager.instance.set(CACHED_MEETING_CONFIG_KEY, meetingConfig);

                console.info("Meeting configuration updated successfully");
            } catch (error) {
                console.error("Error checking meeting configuation", error);
            }
        } else {
            console.info("Skipping meeting config check - checked recently");
        }
    } catch (error) {
        console.error("Error in updateUserMeetingConfig", error);
    }
};

MiddlewareRegistry.register(meetingConfigMiddleware);
