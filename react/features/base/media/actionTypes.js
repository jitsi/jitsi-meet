import { Symbol } from '../react';

/**
 * Action to set the muted state of the local audio.
 *
 * {
 *      type: SET_AUDIO_MUTED,
 *      muted: boolean
 * }
 */
export const SET_AUDIO_MUTED = Symbol('SET_AUDIO_MUTED');

/**
 * Action to set the facing mode of the local video camera.
 *
 * {
 *      type: SET_CAMERA_FACING_MODE,
 *      cameraFacingMode: CAMERA_FACING_MODE
 * }
 */
export const SET_CAMERA_FACING_MODE = Symbol('SET_CAMERA_FACING_MODE');

/**
 * Action to set the muted state of the local video.
 *
 * {
 *      type: SET_VIDEO_MUTED,
 *      muted: boolean
 * }
 */
export const SET_VIDEO_MUTED = Symbol('SET_VIDEO_MUTED');
