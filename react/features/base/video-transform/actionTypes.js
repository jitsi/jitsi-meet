// @flow

/**
 * Action to apply (incrementally) the transformation properties
 * (zoom, position) of a participant's video.
 */
export const APPLY_VIDEO_TRANSFORMATION
    = Symbol('APPLY_VIDEO_TRANSFORMATION');

/**
 * Action to update the tranformation properties (zoom, position) of
 * a participant's video.
 */
export const UPDATE_VIDEO_TRANSFORMATION
    = Symbol('UPDATE_VIDEO_TRANSFORMATION');
