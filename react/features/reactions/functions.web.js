// @flow

/**
 * Returns the visibility state of the reactions menu.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getReactionsMenuVisibility(state: Object) {
    return state['features/reactions'].visible;
}
