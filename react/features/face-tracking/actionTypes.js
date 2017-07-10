/**
 * Action to enable face tracking.
 *
 * {
 *     type: ENABLE_FACE_TRACKING
 * }
 */
export const ENABLE_FACE_TRACKING = Symbol('ENABLE_FACE_TRACKING');

/**
 * Action to disable face tracking.
 *
 * {
 *     type: DISABLE_FACE_TRACKING
 * }
 */
export const DISABLE_FACE_TRACKING = Symbol('DISABLE_FACE_TRACKING');

/**
 * Action to add a FaceTracker instance.
 *
 * {
 *     type: ADD_FACE_TRACKER
 * }
 */
export const ADD_FACE_TRACKER = Symbol('ADD_FACE_TRACKER');

/**
 * Action to show face prompt.
 *
 * {
 *     type: SHOW_PROMPT
 * }
 */
export const SHOW_PROMPT = Symbol('SHOW_PROMPT');

/**
 * Action to hide face prompt.
 *
 * {
 *     type: HIDE_PROMPT
 * }
 */
export const HIDE_PROMPT = Symbol('HIDE_PROMPT');
