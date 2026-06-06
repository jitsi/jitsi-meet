/**
 * Percent of pixels that signal if two images should be considered different.
 */
export const PERCENTAGE_LOWER_BOUND = 4;

/**
 * Number of milliseconds that represent how often screenshots should be taken.
 */
export const POLL_INTERVAL = 2000;

/**
 * SET_TIMEOUT constant is used to set interval and it is set in
 * the id property of the request.data property. TimeMs property must
 * also be set.
 *
 * ```
 * Request.data example:
 * {
 *      id: SET_TIMEOUT,
 *      timeMs: 33
 * }
 * ```
 */
export const SET_TIMEOUT = 1;

/**
 * CLEAR_TIMEOUT constant is used to clear the interval and it is set in
 * the id property of the request.data property.
 *
 * ```
 * {
 *      id: CLEAR_TIMEOUT
 * }
 * ```
 */
export const CLEAR_TIMEOUT = 2;

/**
 * TIMEOUT_TICK constant is used as response and it is set in the id property.
 *
 * ```
 * {
 *      id: TIMEOUT_TICK
 * }
 * ```
 */
export const TIMEOUT_TICK = 3;

export const SCREENSHOT_QUEUE_LIMIT = 3;

export const MAX_FILE_SIZE = 1000000;
