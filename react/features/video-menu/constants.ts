/**
 * Used to set maximumValue for native volume slider.
 * Slider double-precision floating-point number indicating the volume,
 * from 0 mute to 1 max, which converts to 0 mute to 19 max in our case.
 * 0 as muted, 10 as standard and 19 as max remote participant volume level.
 */
export const NATIVE_VOLUME_SLIDER_SCALE = 19;

/**
 * Used to modify initialValue, which is expected to be a decimal value between
 * 0 and 1, and converts it to a number representable by an input slider, which
 * recognizes whole numbers.
 */
export const VOLUME_SLIDER_SCALE = 100;
