import { AnyAction, Dispatch, Middleware } from "redux";

import MiddlewareRegistry from "../../redux/MiddlewareRegistry";
import { setPlanName, updateMeetingConfig } from "../general/store/meeting/actions";
import { MEETING_REDUCER } from "../general/store/meeting/reducer";
import { updateUser } from "../general/store/user/actions";
import { LocalStorageManager, STORAGE_KEYS } from "../LocalStorageManager";
import { AuthService } from "../services/auth.service";
import { PaymentsService } from "../services/payments.service";
import { isAvatarExpired } from "../services/utils/avatar.utils";

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
 * Minimum interval between user data refresh (in ms).
 * Default: 30 minutes
 */
const USER_REFRESH_INTERVAL = 30 * 60 * 1000;

/**
 * Middleware for automatically managing meeting configuration and user data.
 */
export const meetingConfigMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);

    switch (action.type) {
        case AUTH_ACTIONS.LOGIN_SUCCESS:
            updateUserMeetingConfig(store.dispatch, true);
            refreshUserData(store.dispatch);
            refreshUserAvatar(store.dispatch);
            break;

        case AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS:
            updateUserMeetingConfig(store.dispatch);
            refreshUserData(store.dispatch);
            refreshUserAvatar(store.dispatch);

            break;

        case AUTH_ACTIONS.INITIALIZE_AUTH:
            if (action.payload?.isAuthenticated) {
                const meetingState = store.getState()[MEETING_REDUCER];

                if (!meetingState.enabled) {
                    updateUserMeetingConfig(store.dispatch, true);
                } else {
                    updateUserMeetingConfig(store.dispatch);
                }

                refreshUserData(store.dispatch, true);
                refreshUserAvatar(store.dispatch);
            }
            break;

        case AUTH_ACTIONS.LOGOUT:
            try {
                LocalStorageManager.instance.clearStorage();
                LocalStorageManager.instance.clearCredentials();
            } catch (error) {
                console.error("Error clearing cached data from localStorage", error);
            }
            break;

        default:
            break;
    }

    return result;
};

/**
 * Updates the user's meeting configuration and plan name
 *
 * @param dispatch - Redux dispatch function
 * @param force - Force update even if the interval hasn't passed
 * @returns Promise<void>
 */
export const updateUserMeetingConfig = async (dispatch: Dispatch<AnyAction>, force: boolean = false): Promise<void> => {
    try {
        const now = Date.now();
        const lastCheckTime = LocalStorageManager.instance.get<number>(STORAGE_KEYS.LAST_CONFIG_CHECK, 0) ?? 0;
        const hasExpiredVerificationInterval = now - lastCheckTime > CONFIG_CHECK_INTERVAL;

        if (force || hasExpiredVerificationInterval) {
            try {
                const userTier = await PaymentsService.instance.getUserTier();

                const { enabled, paxPerCall } = userTier.featuresPerService["meet"];
                const planName = userTier.label;

                dispatch(updateMeetingConfig({ enabled, paxPerCall }));
                dispatch(setPlanName(planName));

                LocalStorageManager.instance.set(STORAGE_KEYS.LAST_CONFIG_CHECK, now);

                console.info("Meeting configuration and plan name updated successfully");
            } catch (error) {
                console.error("Error checking meeting configuration", error);
            }
        } else {
            console.info("Skipping meeting config check - checked recently");
        }
    } catch (error) {
        console.error("Error in updateUserMeetingConfig", error);
    }
};

/**
 * Refreshes user data and avatar
 *
 * @param dispatch - Redux dispatch function
 * @param force - Force refresh even if the interval hasn't passed
 * @returns Promise<void>
 */
export const refreshUserData = async (dispatch: Dispatch<AnyAction>, force: boolean = false): Promise<void> => {
    try {
        const now = Date.now();
        const lastRefreshTime = LocalStorageManager.instance.get<number>(STORAGE_KEYS.LAST_USER_REFRESH, 0) ?? 0;
        const hasExpiredRefreshInterval = now - lastRefreshTime > USER_REFRESH_INTERVAL;
        const currentUser = LocalStorageManager.instance.getUser();
        const tokenNeedsRefresh = shouldRefreshToken();

        if (!currentUser) {
            return;
        }

        if (force || tokenNeedsRefresh || hasExpiredRefreshInterval) {
            try {
                const refreshResponse = await AuthService.instance.refreshUserAndTokens();

                const updatedUser = {
                    ...currentUser,
                    ...refreshResponse.user,
                    createdAt: currentUser.createdAt,
                };

                LocalStorageManager.instance.saveCredentials(
                    refreshResponse.token,
                    refreshResponse.newToken,
                    updatedUser.mnemonic,
                    updatedUser
                );

                dispatch(updateUser(updatedUser));
                LocalStorageManager.instance.set(STORAGE_KEYS.LAST_USER_REFRESH, now);
            } catch (error) {
                console.error("Error refreshing user data:", error);
            }
        }
    } catch (error) {
        console.error("Error in refreshUserData", error);
    }
};

/**
 * Checks if token should be refreshed (expires in next 24 hours)
 */
const shouldRefreshToken = (): boolean => {
    const userToken = LocalStorageManager.instance.getToken();
    if (!userToken) return true;

    try {
        const payload = JSON.parse(atob(userToken.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const expirationTime = payload.exp;
        const bufferTime = 24 * 60 * 60;

        return expirationTime - currentTime < bufferTime;
    } catch (error) {
        return true;
    }
};

/**
 * Refreshes user avatar independently
 *
 * @param dispatch - Redux dispatch function
 * @returns Promise<void>
 */
export const refreshUserAvatar = async (dispatch: Dispatch<AnyAction>): Promise<void> => {
    try {
        const currentUser = LocalStorageManager.instance.getUser();
        if (!currentUser?.avatar) {
            return;
        }

        const needsRefresh = isAvatarExpired(currentUser.avatar);

        if (needsRefresh) {
            const avatarRefreshedResponse = await AuthService.instance.refreshAvatarUser();

            dispatch(
                updateUser({
                    avatar: avatarRefreshedResponse.avatar,
                })
            );

            const updatedUser = { ...currentUser, avatar: avatarRefreshedResponse.avatar };
            LocalStorageManager.instance.setUser(updatedUser);
        }
    } catch (error) {
        console.error("Error refreshing avatar:", error);
    }
};

MiddlewareRegistry.register(meetingConfigMiddleware);
