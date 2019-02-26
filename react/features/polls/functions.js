// @flow

/**
 * Filter current poll from previous polls.
 *
 * @param {Object} polls - Object contating all polls by ID.
 * @param {string} currentPoll - Current Poll ID or null.
 * @returns {Object} - Object with past polls only.
 */
export function getPastPolls(polls: Object, currentPoll: ?string): Object {
    const filtered = Object.keys(polls)
        .filter(key => key !== currentPoll)
        .reduce((obj, key) => {
            obj[key] = polls[key];

            return obj;
        }, {});

    return filtered;
}
