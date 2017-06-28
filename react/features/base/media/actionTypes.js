/**
 * The type of (redux) action to set the muted state of the local audio.
 *
 * {
 *     type: SET_AUDIO_MUTED,
 *     muted: boolean
 * }
 */
export const SET_AUDIO_MUTED = Symbol('SET_AUDIO_MUTED');

/**
 * The type of (redux) action to set the facing mode of the local video camera
 * to a specific value.
 *
 * {
 *     type: SET_CAMERA_FACING_MODE,
 *     cameraFacingMode: CAMERA_FACING_MODE
 * }
 */
export const SET_CAMERA_FACING_MODE = Symbol('SET_CAMERA_FACING_MODE');

/**
 * The type of (redux) action to adjust the availability of the local video.
 *
 * {
 *     type: SET_VIDEO_AVAILABLE,
 *     muted: boolean
 * }
 */
export const SET_VIDEO_AVAILABLE = Symbol('SET_VIDEO_AVAILABLE');

/**
 * The type of (redux) action to set the muted state of the local video.
 *
 * {
 *     type: SET_VIDEO_MUTED,
 *     muted: boolean
 * }
 */
export const SET_VIDEO_MUTED = Symbol('SET_VIDEO_MUTED');

/**
 * The type of (redux) action to toggle the local video camera facing mode. In
 * contrast to SET_CAMERA_FACING_MODE, allows the toggling to be optimally
 * and/or natively implemented without the overhead of separate reads and writes
 * of the current/effective camera facing mode.
 *
 * {
 *     type: TOGGLE_CAMERA_FACING_MODE
 * }
 */
export const TOGGLE_CAMERA_FACING_MODE = Symbol('TOGGLE_CAMERA_FACING_MODE');
