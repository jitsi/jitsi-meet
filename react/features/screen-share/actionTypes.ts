/**
 * Type of action which saves the noise suppression state before desktop audio sharing disables it.
 *
 * {
 *     type: SET_NS_ENABLED_BEFORE_SHARE,
 *     nsEnabledBeforeShare: boolean
 * }
 */
export const SET_NS_ENABLED_BEFORE_SHARE = 'SET_NS_ENABLED_BEFORE_SHARE';

/**
 * Type of action which sets the current state of screen audio sharing.
 *
 * {
 *     type: SET_SCREEN_AUDIO_SHARE_STATE,
 *     isSharingAudio: boolean
 * }
 */
export const SET_SCREEN_AUDIO_SHARE_STATE = 'SET_SCREEN_AUDIO_SHARE_STATE';

/**
 * Type of action which sets the capture frame rate for screenshare.
 * {
 *      type: SET_SCREENSHARE_CAPTURE_FRAME_RATE,
 *      captureFrameRate: number
 * }
 */
export const SET_SCREENSHARE_CAPTURE_FRAME_RATE = 'SET_SCREENSHARE_CAPTURE_FRAME_RATE';

/**
 * Type of action which sets the current audio track captured from the screenshare.
 * {
 *      type: SET_SCREENSHARE_TRACKS,
 *      desktopAudioTrack: JitsiTrack
 * }
 */
export const SET_SCREENSHARE_TRACKS = 'SET_SCREENSHARE_TRACKS';
