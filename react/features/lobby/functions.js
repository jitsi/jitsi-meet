// @flow

/**
 * Selector to return lobby state.
 *
 * @param {any} state - State object.
 * @returns {any}
 */
export function getLobbyState(state: any) {
    return state['features/lobby'];
}
