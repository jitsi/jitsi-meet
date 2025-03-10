export class LocalStorageManager {
    private static _instance: LocalStorageManager;

    private static readonly KEYS = {
        TOKEN: "xToken",
        NEW_TOKEN: "xNewToken",
        MNEMONIC: "xMnemonic",
        USER: "xUser",

    };

    private constructor() {

    }

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
     * Gets the authentication token
     */
    public getToken(): string | null| undefined {
        return this.get<string>(LocalStorageManager.KEYS.TOKEN);
    }

    /**
     * Sets the authentication token
     */
    public setToken(token: string): void {
        this.set(LocalStorageManager.KEYS.TOKEN, token);
    }

    /**
     * Gets the new token
     */
    public getNewToken(): string | null| undefined {
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
    public getMnemonic(): string | null| undefined {
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
    public getUser<T = any>(): T | null| undefined {
        return this.get<T>(LocalStorageManager.KEYS.USER);
    }

    /**
     * Sets the user information
     */
    public setUser<T>(user: T): void {
        this.set(LocalStorageManager.KEYS.USER, user);
    }

    /**
     * Saves the session credentials
     * @param token Token
     * @param newToken New token
     * @param mnemonic Mnemonic
     * @param user User information
     */
    public saveCredentials(token: string, newToken: string, mnemonic: string, user: any): void {
        this.setToken(token);
        this.setNewToken(newToken);
        this.setMnemonic(mnemonic);
        this.setUser(user);
    }

    /**
     * Removes the session credentials
     */
    public clearCredentials(): void {
        this.remove(LocalStorageManager.KEYS.TOKEN);
        this.remove(LocalStorageManager.KEYS.NEW_TOKEN);
        this.remove(LocalStorageManager.KEYS.MNEMONIC);
        this.remove(LocalStorageManager.KEYS.USER);
    }
}

/**
 * Hook to use LocalStorageManager in functional components
 */
export function useLocalStorage() {
    return LocalStorageManager.instance;
}

export default LocalStorageManager.instance;
