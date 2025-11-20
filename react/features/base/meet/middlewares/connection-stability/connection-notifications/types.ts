/**
 * State interface for tracking connection notification behavior
 */
export interface ConnectionState {
    /**
     * True when conference media listeners (ICE/Media events) have been attached
     * Prevents duplicate event listener registration
     */
    hasConferenceListeners: boolean;

    /**
     * True when connection listeners (XMPP/WebSocket events) have been attached
     * Prevents duplicate event listener registration
     */
    hasConnectionListeners: boolean;

    /**
     * True when media connection (ICE) was interrupted
     * Used to only show "connection restored" notification if there was a previous interruption
     */
    wasMediaConnectionInterrupted: boolean;
}
