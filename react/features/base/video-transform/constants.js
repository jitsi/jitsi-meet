// @flow

/**
 * The type of the transform object.
 */
export type Transform = {
    scale: number,
    translateX: number,
    translateY: number
};

/**
 * The default transform values (no transform).
 */
export const DEFAULT_TRANSFORM = {
    scale: 1,
    translateX: 0,
    translateY: 0
};
