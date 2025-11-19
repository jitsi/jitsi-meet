import { ConnectionState } from './types';

/**
 * Factory function to create a new connection state instance
 *
 * @returns A new ConnectionState object with default values
 */
export const createConnectionState = (): ConnectionState => ({
    hasConferenceListeners: false,
    hasConnectionListeners: false,
    wasMediaConnectionInterrupted: false,
});
