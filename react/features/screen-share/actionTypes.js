// @flow

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
