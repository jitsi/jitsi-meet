/**
 * Utility functions for safely calling conference methods that might not exist
 * in all versions of lib-jitsi-meet.
 */

/**
 * Safely calls a method on the conference object with error handling.
 * 
 * @param conference - The conference object
 * @param methodName - The name of the method to call
 * @param args - Arguments to pass to the method
 * @returns The result of the method call or undefined if it fails
 */
export function safeConferenceCall(conference: any, methodName: string, ...args: any[]): any {
    if (!conference || typeof conference[methodName] !== 'function') {
        console.warn(`Conference method ${methodName} is not available`);
        return undefined;
    }

    try {
        return conference[methodName](...args);
    } catch (error) {
        console.warn(`Error calling conference.${methodName}:`, error);
        return undefined;
    }
}

/**
 * Safely gets polls from conference with error handling.
 * 
 * @param conference - The conference object
 * @returns The polls object or undefined if not available
 */
export function safeGetPolls(conference: any) {
    return safeConferenceCall(conference, 'getPolls');
}

/**
 * Safely gets breakout rooms from conference with error handling.
 * 
 * @param conference - The conference object
 * @returns The breakout rooms object or undefined if not available
 */
export function safeGetBreakoutRooms(conference: any) {
    return safeConferenceCall(conference, 'getBreakoutRooms');
}

/**
 * Safely checks if polls are supported.
 * 
 * @param conference - The conference object
 * @returns True if polls are supported, false otherwise
 */
export function arePollsSupported(conference: any): boolean {
    const polls = safeGetPolls(conference);
    if (!polls || typeof polls.isSupported !== 'function') {
        return false;
    }
    
    try {
        return polls.isSupported();
    } catch (error) {
        console.warn('Error checking polls support:', error);
        return false;
    }
}

/**
 * Safely checks if breakout rooms are supported.
 * 
 * @param conference - The conference object
 * @returns True if breakout rooms are supported, false otherwise
 */
export function areBreakoutRoomsSupported(conference: any): boolean {
    const breakoutRooms = safeGetBreakoutRooms(conference);
    if (!breakoutRooms || typeof breakoutRooms.isSupported !== 'function') {
        return false;
    }
    
    try {
        return breakoutRooms.isSupported();
    } catch (error) {
        console.warn('Error checking breakout rooms support:', error);
        return false;
    }
}