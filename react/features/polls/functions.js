// @flow

/**
 * Should poll results be shown.
 *
 * @param {Object} state - Global state.
 * @param {string} id - Id of the poll.
 * @returns {boolean} Should poll results be shown.
 */
export const shouldShowResults = (state: Object, id: string) => Boolean(state['features/polls']?.polls[id].showResults);

/**
 * Selector for calculating the number of hidden poll messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of hidden polls.
 */
export function getHiddenPollCount(state: Object) {
    const { polls } = state['features/polls'];
    let hiddenCount = 0;

    for (const pollId of Object.keys(polls)) {
        if (polls[pollId].hidden) {
            hiddenCount++;
        }
    }

    return hiddenCount;
}

/**
 * Selector for calculating the number of unread poll messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of unread polls.
 */
export function getUnreadPollCount(state: Object) {
    const { nbUnreadPolls } = state['features/polls'];

    if (isPollsModerationEnabled(state)) {
        return nbUnreadPolls - getHiddenPollCount(state);
    }

    return nbUnreadPolls;
}

/**
 * Get whether the polls moderation is enabled or not.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} The enabled flag.
 */
export function isPollsModerationEnabled(state: Object) {
    const enablePollsModeration = state['features/base/config']?.enablePollsModeration === true;

    return enablePollsModeration;
}
