import ReducerRegistry from "../../../../redux/ReducerRegistry";
import { CLEAR_USER, SET_USER, UPDATE_USER, UserActionTypes } from "./actionTypes";
import { UserReducerState } from "./types";

/**
 * Default state for the user reducer
 */
const DEFAULT_STATE: UserReducerState = {
    user: null,
    lastUpdated: null,
};

/**
 * The Redux namespace for the user
 */
export const USER_REDUCER = "features/user";

/**
 * Reducer for user information
 *
 * @param state
 * @param action
 * @returns New state
 */
export const userReducer = (state: UserReducerState = DEFAULT_STATE, action: UserActionTypes): UserReducerState => {
    switch (action.type) {
        case SET_USER: {
            return {
                ...state,
                user: action.payload,
                lastUpdated: Date.now(),
            };
        }

        case UPDATE_USER: {
            if (!state.user) {
                return state;
            }

            return {
                ...state,
                user: {
                    ...state.user,
                    ...action.payload,
                },
                lastUpdated: Date.now(),
            };
        }

        case CLEAR_USER: {
            return {
                ...state,
                user: null,
                lastUpdated: Date.now(),
            };
        }

        default:
            return state;
    }
};

ReducerRegistry.register<UserReducerState>(USER_REDUCER, userReducer);
