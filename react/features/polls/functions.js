// @flow

/**
 * Is the poll answered.
 *
 * @param {Object} state - Global state.
 * @param {string} id - Id of the poll.
 * @returns {boolean} Is the poll answered.
 */
export const isPollAnswered = (state: Object, id: string) => Boolean(state['features/polls']?.polls[id].answered);


/**
 * Selector for calculating the number of unread poll messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of unread messages.
 */
export function getUnreadPollCount(state: Object) {
    const { nbUnreadReadMessage } = state['features/polls'];

    return nbUnreadReadMessage;
}
