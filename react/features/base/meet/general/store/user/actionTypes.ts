import { User } from "./types";



/**
 * Sets the user information
 */
export const SET_USER = "SET_USER";

/**
 * Updates the user information
 */
export const UPDATE_USER = "UPDATE_USER";

/**
 * Clears the user information
 */
export const CLEAR_USER = "CLEAR_USER";

/**
 * Action type definitions
 */
export interface SetUserAction {
    type: typeof SET_USER;
    payload: User;
}

export interface UpdateUserAction {
    type: typeof UPDATE_USER;
    payload: Partial<User>;
}

export interface ClearUserAction {
    type: typeof CLEAR_USER;
}

export type UserActionTypes = SetUserAction | UpdateUserAction | ClearUserAction;