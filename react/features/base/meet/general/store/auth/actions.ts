import { AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";
import { IReduxState } from "../../../../../app/types";
import { LocalStorageManager } from "../../../LocalStorageManager";
import { AUTH_ACTIONS } from "../../../middlewares";
import { User } from "../user/types";

/**
 * Action to initialise the authentication status at application startup.
 * Checks for saved authentication tokens and updates the status accordingly.
 *
 * @returns {ThunkAction} Thunk action for asynchronous dispatch.
 */
export const initializeAuth = (): ThunkAction<void, IReduxState, unknown, AnyAction> => {
    return (dispatch) => {
        const localStorageManager = LocalStorageManager.instance;
        const token = localStorageManager.getNewToken();
        const isUserAuthenticated = !!token;

        dispatch({
            type: AUTH_ACTIONS.INITIALIZE_AUTH,
            payload: {
                isAuthenticated: isUserAuthenticated,
                token: isUserAuthenticated ? token : null,
            },
        });
    };
};

/**
 * Action creator for successful login
 *
 * @param {object} credentials - User credentials from successful login
 * @param {string} credentials.newToken - User's new authentication token
 * @param {string} credentials.mnemonic - User's mnemonic
 * @param {object} credentials.user - User's information
 * @returns {object} Action object
 */
export const loginSuccess = (credentials: { newToken: string; mnemonic: string; user: User }) => {
    return {
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
            token: credentials.newToken,
            user: credentials.user,
        },
    };
};

/**
 * Action creator for logout
 *
 * @returns {object} Action object
 */
export const logout = () => {
    return {
        type: AUTH_ACTIONS.LOGOUT,
    };
};

/**
 * Action creator for token refresh success
 *
 * @param {object} data - Token refresh data
 * @param {string} data.token - New token
 * @returns {object} Action object
 */
export const refreshTokenSuccess = (data: { token: string }) => {
    return {
        type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS,
        payload: {
            token: data.token,
        },
    };
};