/**
 * Action to change muted state of the local audio.
 *
 * {
 *      type: AUDIO_MUTED_CHANGED,
 *      muted: boolean
 * }
 */
export const AUDIO_MUTED_CHANGED = 'AUDIO_MUTED_CHANGED';

/**
 * Action to signal a change of the facing mode of the local video camera.
 *
 * {
 *      type: CAMERA_FACING_MODE_CHANGED,
 *      cameraFacingMode: CAMERA_FACING_MODE
 * }
 */
export const CAMERA_FACING_MODE_CHANGED = 'CAMERA_FACING_MODE_CHANGED';

/**
 * Action to change muted state of the local video.
 *
 * {
 *      type: VIDEO_MUTED_CHANGED,
 *      muted: boolean
 * }
 */
export const VIDEO_MUTED_CHANGED = 'VIDEO_MUTED_CHANGED';
