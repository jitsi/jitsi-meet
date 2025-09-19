import { UserSettings } from "@internxt/sdk/dist/shared/types/userSettings";

/**
 * Interface for the user reducer state in Redux
 * Contains user information and any additional state properties
 */
export interface UserReducerState {
    /**
     * Complete user information
     */
    user: UserSettings | null;

    /**
     * Last time the user data was updated
     */
    lastUpdated: number | null;
}


export type User = UserSettings | null;