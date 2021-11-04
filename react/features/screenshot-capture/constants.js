// @flow

/**
 * Percent of pixels that signal if two images should be considered different.
 */
export const PERCENTAGE_LOWER_BOUND = 5;

/**
 * Number of milliseconds that represent how often screenshots should be taken.
 */
export const POLL_INTERVAL = 2000;

/**
 * SET_INTERVAL constant is used to set interval and it is set in
 * the id property of the request.data property. TimeMs property must
 * also be set. Request.data example:
 *
 * {
 *      id: SET_INTERVAL,
 *      timeMs: 33
 * }.
 */
export const SET_INTERVAL = 1;

/**
 * CLEAR_INTERVAL constant is used to clear the interval and it is set in
 * the id property of the request.data property.
 *
 * {
 *      id: CLEAR_INTERVAL
 * }.
 */
export const CLEAR_INTERVAL = 2;

/**
 * INTERVAL_TIMEOUT constant is used as response and it is set in the id property.
 *
 * {
 *      id: INTERVAL_TIMEOUT
 * }.
 */
export const INTERVAL_TIMEOUT = 3;
