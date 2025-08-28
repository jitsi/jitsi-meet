/**
 * The aspect ratio constant which indicates that the width (of whatever the
 * aspect ratio constant is used for) is smaller than the height.
 *
 * @type {Symbol}
 */
export const ASPECT_RATIO_NARROW = Symbol('ASPECT_RATIO_NARROW');

/**
 * The aspect ratio constant which indicates that the width (of whatever the
 * aspect ratio constant is used for) is larger than the height.
 *
 * @type {Symbol}
 */
export const ASPECT_RATIO_WIDE = Symbol('ASPECT_RATIO_WIDE');

/**
 * Smallest supported mobile width.
 */
export const SMALL_MOBILE_WIDTH = '320';

/**
 * The width for desktop that we start hiding elements from the UI (video quality label, filmstrip, etc).
 * This should match the value for $verySmallScreen in _variables.scss.
 *
 * @type {number}
 */
export const SMALL_DESKTOP_WIDTH = 500;
