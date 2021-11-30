// @flow

/**
 * The type of (redux) action which sets the applicable last-n for the conference.
 *
 * {
 *     type: SET_APPLIED_LAST_N,
 *     appliedLastN: number
 * }
 */
export const SET_APPLIED_LAST_N = 'SET_APPLIED_LAST_N';

/**
 * The type of (redux) action which sets the last-n for the conference based on the user's configurations.
 *
 * {
 *     type: SET_CONFIG_LAST_N,
 *     configLastN: number
 * }
 */
 export const SET_CONFIG_LAST_N = 'SET_CONFIG_LAST_N';