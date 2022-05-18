// @flow

/**
 * Is noise suppression currently active.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function isNoiseSuppressionActive(state: Object) {
    return state['features/noise-suppression'].isNoiseSuppressionActive;
}
