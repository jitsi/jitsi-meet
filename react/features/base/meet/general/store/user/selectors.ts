import { IReduxState } from "../../../../../app/types";
import { USER_REDUCER } from "./reducer";
import { User, UserReducerState } from "./types";

/**
 * Selector to get the complete user reducer state
 *
 * @param state - The Redux state
 * @returns The user reducer state
 */
export function getUserState(state: IReduxState): UserReducerState {
    return state[USER_REDUCER];
}

/**
 * Selector to get the last updated timestamp
 *
 * @param state - The Redux state
 * @returns The last updated timestamp or null
 */
export function getLastUpdated(state: IReduxState): number | null {
    return state[USER_REDUCER].lastUpdated;
}

/**
 * Selector to get the complete user information
 *
 * @param state - The Redux state
 * @returns The user information or null
 */
export function getUser(state: IReduxState): User | null {
    return state[USER_REDUCER].user;
}

/**
 * Selector to check if user is authenticated
 *
 * @param state - The Redux state
 * @returns Whether the user is authenticated
 */
export function isAuthenticated(state: IReduxState): boolean {
    return !!state[USER_REDUCER].user;
}

/**
 * Selector to get user's ID
 *
 * @param state - The Redux state
 * @returns The user ID or null
 */
export function getUserId(state: IReduxState): string | null {
    return state[USER_REDUCER].user?.userId || null;
}

/**
 * Selector to get user's email
 *
 * @param state - The Redux state
 * @returns The user's email or null
 */
export function getUserEmail(state: IReduxState): string | null {
    return state[USER_REDUCER].user?.email || null;
}

/**
 * Selector to get user's full name
 *
 * @param state - The Redux state
 * @returns The user's full name or null
 */
export function getUserFullName(state: IReduxState): string | null {
    const user = state[USER_REDUCER].user;
    if (!user) return null;

    return `${user.name} ${user.lastname}`.trim() || null;
}

/**
 * Selector to check if user has completed registration
 *
 * @param state - The Redux state
 * @returns Whether registration is completed
 */
export function hasCompletedRegistration(state: IReduxState): boolean {
    return !!state[USER_REDUCER].user?.registerCompleted;
}

/**
 * Selector to check if user has teams feature
 *
 * @param state - The Redux state
 * @returns Whether user has teams feature
 */
export function hasTeamsFeature(state: IReduxState): boolean {
    return !!state[USER_REDUCER].user?.teams;
}

/**
 * Selector to get user's root folder ID
 *
 * @param state - The Redux state
 * @returns The root folder ID or null
 */
export function getRootFolderId(state: IReduxState): string | null {
    return state[USER_REDUCER].user?.rootFolderId || null;
}

/**
 * Selector to get user's root folder UUID
 *
 * @param state - The Redux state
 * @returns The root folder UUID or null
 */
export function getRootFolderUuid(state: IReduxState): string | null {
    return state[USER_REDUCER].user?.rootFolderUuid || null;
}
