import { UserSubscription } from "@internxt/sdk/dist/drive/payments/types/types";
import { v4 } from "uuid";
import { User } from "./general/store/user/types";

/**
 * Public keys for localStorage management
 */
export const STORAGE_KEYS = {
    LAST_CONFIG_CHECK: "lastMeetingConfigCheck",
    CACHED_MEETING_CONFIG: "cachedMeetingConfig",
    LAST_USER_REFRESH: "lastUserRefresh",
};

export class LocalStorageManager {
    private static _instance: LocalStorageManager;

    private static readonly KEYS = {
        NEW_TOKEN: "xNewToken",
        MNEMONIC: "xMnemonic",
        USER: "xUser",
        SUBSCRIPTION: "xSubscription",
        ANONYMOUS_USER_UUID: "xAnonymousUserUUID",
    };

    private constructor() {}

    /**
     * Gets the singleton instance
     */
    public static get instance(): LocalStorageManager {
        if (!LocalStorageManager._instance) {
            LocalStorageManager._instance = new LocalStorageManager();
        }
        return LocalStorageManager._instance;
    }

    /**
     * Sets a value in localStorage
     * @param key Key
     * @param value Value to store
     */
    public set<T>(key: string, value: T): void {
        try {
            const valueToStore = typeof value === "object" ? JSON.stringify(value) : String(value);
            localStorage.setItem(key, valueToStore);
        } catch (error) {
            console.error(`Error storing ${key} in localStorage:`, error);
        }
    }

    /**
     * Gets a value from localStorage
     * @param key Key
     * @param defaultValue Default value if key doesn't exist
     * @returns The stored value or default value
     */
    public get<T>(key: string, defaultValue?: T): T | null | undefined {
        try {
            const value = localStorage.getItem(key);
            if (value === null) return defaultValue;

            // Try to determine if the value should be a JSON object
            if (value.startsWith("{") || value.startsWith("[")) {
                try {
                    return JSON.parse(value) as T;
                } catch {
                    // If it's not valid JSON, return the value as is
                    return value as unknown as T;
                }
            }

            return value as unknown as T;
        } catch (error) {
            console.error(`Error getting ${key} from localStorage:`, error);
            return defaultValue;
        }
    }

    /**
     * Removes a value from localStorage
     * @param key Key to remove
     */
    public remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
        }
    }

    /**
     * Clears all localStorage
     */
    public clear(): void {
        try {
            localStorage.clear();
        } catch (error) {
            console.error("Error clearing localStorage:", error);
        }
    }

    /**
     * Checks if a key exists in localStorage
     * @param key Key to check
     * @returns true if exists, false otherwise
     */
    public has(key: string): boolean {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Gets the new token
     */
    public getNewToken(): string | null | undefined {
        return this.get<string>(LocalStorageManager.KEYS.NEW_TOKEN);
    }

    /**
     * Sets the new token
     */
    public setNewToken(token: string): void {
        this.set(LocalStorageManager.KEYS.NEW_TOKEN, token);
    }

    /**
     * Gets the mnemonic
     */
    public getMnemonic(): string | null | undefined {
        return this.get<string>(LocalStorageManager.KEYS.MNEMONIC);
    }

    /**
     * Sets the mnemonic
     */
    public setMnemonic(mnemonic: string): void {
        this.set(LocalStorageManager.KEYS.MNEMONIC, mnemonic);
    }

    /**
     * Gets the user information
     */
    public getUser(): User | null | undefined {
        return this.get(LocalStorageManager.KEYS.USER);
    }

    /**
     * Sets the user information
     */
    public setUser<T>(user: T): void {
        this.set(LocalStorageManager.KEYS.USER, user);
    }

    /**
     * Gets the user subscription
     */
    public getSubscription(): UserSubscription | null | undefined {
        return this.get<UserSubscription>(LocalStorageManager.KEYS.SUBSCRIPTION);
    }

    /**
     * Sets the user subscription
     */
    public setSubscription(subscription: UserSubscription): void {
        this.set(LocalStorageManager.KEYS.SUBSCRIPTION, subscription);
    }

    /**
     * Removes the user subscription
     */
    public removeSubscription(): void {
        this.remove(LocalStorageManager.KEYS.SUBSCRIPTION);
    }

    /**
     * Generates and stores a UUID for anonymous users
     * @returns The generated or existing UUID
     */
    public getOrCreateAnonymousUUID(): string {
        let uuid = this.get<string>(LocalStorageManager.KEYS.ANONYMOUS_USER_UUID);

        if (!uuid) {
            uuid = v4();
            this.set(LocalStorageManager.KEYS.ANONYMOUS_USER_UUID, uuid);
        }

        return uuid;
    }

    /**
     * Gets the anonymous user UUID
     */
    public getAnonymousUUID(): string | null | undefined {
        return this.get<string>(LocalStorageManager.KEYS.ANONYMOUS_USER_UUID);
    }

    /**
     * Sets the anonymous user UUID
     */
    public setAnonymousUUID(uuid: string): void {
        this.set(LocalStorageManager.KEYS.ANONYMOUS_USER_UUID, uuid);
    }

    /**
     * Removes the anonymous user UUID
     */
    public removeAnonymousUUID(): void {
        this.remove(LocalStorageManager.KEYS.ANONYMOUS_USER_UUID);
    }

    /**
     * Saves the session credentials
     * @param newToken New token
     * @param mnemonic Mnemonic
     * @param user User information
     * @param subscription User subscription (optional)
     */
    public saveCredentials(newToken: string, mnemonic: string, user: User, subscription?: UserSubscription): void {
        this.setNewToken(newToken);
        this.setMnemonic(mnemonic);
        this.setUser(user);

        if (subscription) {
            this.setSubscription(subscription);
        }
    }

    /**
     * Removes the session credentials
     */
    public clearCredentials(): void {
        this.remove(LocalStorageManager.KEYS.NEW_TOKEN);
        this.remove(LocalStorageManager.KEYS.MNEMONIC);
        this.remove(LocalStorageManager.KEYS.USER);
        this.remove(LocalStorageManager.KEYS.SUBSCRIPTION);
        this.remove(LocalStorageManager.KEYS.ANONYMOUS_USER_UUID);
    }

    public clearStorage(): void {
        Object.values(STORAGE_KEYS).forEach((key) => {
            this.remove(key);
        });
    }
}

/**
 * Hook to use LocalStorageManager in functional components
 */
export function useLocalStorage() {
    return LocalStorageManager.instance;
}

export default LocalStorageManager.instance;
