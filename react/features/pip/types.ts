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
