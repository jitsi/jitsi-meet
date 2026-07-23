/**
 * MediaSession state for microphone and camera.
 */
export interface IMediaSessionState {
    /**
     * Whether the camera is active (unmuted).
     */
    cameraActive: boolean;

    /**
     * Whether the microphone is active (unmuted).
     */
    microphoneActive: boolean;
}

/**
 * Lifecycle of a host-owned Document PiP window.
 */
export enum EmbeddedDocumentPiPLifecycle {
    ACTIVE = 'active',
    IDLE = 'idle',
    REQUESTING = 'requesting',
    UNAVAILABLE = 'unavailable'
}

/**
 * Capability negotiation state for host-owned embedded Document PiP.
 */
export enum EmbeddedDocumentPiPCapability {
    AVAILABLE = 'available',
    UNAVAILABLE = 'unavailable',
    UNKNOWN = 'unknown'
}
