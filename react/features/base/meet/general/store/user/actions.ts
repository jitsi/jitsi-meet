
import { AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";
import { IReduxState } from "../../../../../app/types";
import { LocalStorageManager } from "../../../LocalStorageManager";
import { CLEAR_USER, SET_USER, UPDATE_USER } from "./actionTypes";
import { User } from "./types";


/**
 * Sets the user information
 *
 * @param user - Complete user information
 * @returns Action object
 */
export function setUser(user: User): {
    type: string;
    payload: User;
} {
    return {
        type: SET_USER,
        payload: user,
    };
}

/**
 * Updates partial user information
 *
 * @param userData - Partial user data to update
 * @returns Action object
 */
export function updateUser(userData: Partial<User>): {
    type: string;
    payload: Partial<User>;
} {
    return {
        type: UPDATE_USER,
        payload: userData,
    };
}

/**
 * Clears all user information
 *
 * @returns Action object
 */
export function clearUser(): {
    type: string;
} {
    return {
        type: CLEAR_USER,
    };
}

/**
 * Initializes user data from local storage
 *
 * @returns Thunk action
 */
export const initializeUser = (): ThunkAction<void, IReduxState, unknown, AnyAction> => {
    return (dispatch) => {
        const localStorageManager = LocalStorageManager.instance;
        const user = localStorageManager.getUser();

        if (user) {
            dispatch(setUser(user));
        }
    };
};
