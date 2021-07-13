// @flow

/**
 * Returns the queue of reactions.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getReactionsQueue(state: Object) {
    return state['features/reactions'].queue;
}
