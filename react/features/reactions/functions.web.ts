/**
 * Returns the visibility state of the reactions menu.
 *
 * @param {Object} state - The state of the application.
 */
export function getReactionsMenuVisibility(state: Object): boolean {
    return state['features/reactions'].visible;
}
