/**
 * Session storage keys used throughout the application
 */
const KEYS = {
    IS_NEW_MEETING_FLOW: "isNewMeetingFlow",
    USER_DATA: "userData",
} as const;

/**
 * Gets an item from session storage
 * @param {string} key - The key to retrieve
 * @returns {string | null} The value or null if not found
 */
const getItem = (key: string): string | null => {
    try {
        return window.sessionStorage.getItem(key);
    } catch (error) {
        console.error(`Error getting item from sessionStorage: ${key}`, error);
        return null;
    }
};

/**
 * Sets an item in session storage
 * @param {string} key - The key to set
 * @param {string} value - The value to set
 */
const setItem = (key: string, value: string): void => {
    try {
        window.sessionStorage.setItem(key, value);
    } catch (error) {
        console.error(`Error setting item in sessionStorage: ${key}`, error);
    }
};

/**
 * Removes an item from session storage
 * @param {string} key - The key to remove
 */
const removeItem = (key: string): void => {
    try {
        window.sessionStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing item from sessionStorage: ${key}`, error);
    }
};

/**
 * Checks if the current flow is coming from a new meeting creation
 * @returns {boolean} True if coming from new meeting flow
 */
export const isNewMeetingFlow = (): boolean => {
    return getItem(KEYS.IS_NEW_MEETING_FLOW) === "true";
};

/**
 * Sets the new meeting flow flag
 * @param {boolean} value - Whether this is a new meeting flow
 */
export const setNewMeetingFlowSession = (value: boolean): void => {
    setItem(KEYS.IS_NEW_MEETING_FLOW, value.toString());
};

/**
 * Clears the new meeting flow flag
 */
export const clearNewMeetingFlowSession = (): void => {
    removeItem(KEYS.IS_NEW_MEETING_FLOW);
};

/**
 * Clears all session storage
 */
export const clearSessionStorage = (): void => {
    try {
        window.sessionStorage.clear();
    } catch (error) {
        console.error("Error clearing sessionStorage", error);
    }
};
