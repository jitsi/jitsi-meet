/**
 * Type of action which sets the current state of noise suppression.
 *
 * {
 *     type: SET_NOISE_SUPPRESSION_STATE,
 *     active: boolean
 * }
 */
export const SET_NOISE_SUPPRESSION_STATE = 'SET_NOISE_SUPPRESSION_STATE';

/**
 * Action which disables or enables noise suppression depending on its current state.
 *
 * {
 *     type: TOGGLE_NOISE_SUPPRESSION,
 * }
 */
export const TOGGLE_NOISE_SUPPRESSION = 'TOGGLE_NOISE_SUPPRESSION';
