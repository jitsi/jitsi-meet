// @flow

/**
 * Is the poll answered.
 *
 * @param {Object} state - Global state.
 * @param {string} id - Id of the poll.
 * @returns {boolean} Is the poll answered.
 */
export const isPollAnswered = (state: Object, id: string) => Boolean(state['features/polls']?.polls[id].answered);
