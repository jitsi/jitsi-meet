/**
 * The name of the Error thrown by {@link JitsiMeetJS.init()} which indicates
 * that WebRTC is not ready and its readiness may be tracked via the
 * webRTCReadyPromise property value of the Error.
 */
export const WEBRTC_NOT_READY = 'WEBRTC_NOT_READY';

/**
 * The name of the Error thrown by {@link JitsiMeetJS.init()} which indicates
 * that WebRTC is not supported by the execution environment either natively or
 * via a known plugin such as Temasys.
 */
export const WEBRTC_NOT_SUPPORTED = 'WEBRTC_NOT_SUPPORTED';
