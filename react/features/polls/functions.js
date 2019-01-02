// @flow

/**
 * Filter out duplicate choices.
 *
 * @param {Object} choices - Object containing choices listed by ID.
 * @returns {Object}
 */
export function getUniquePollChoices(choices: Object): Object {
    const newObj = {};
    const seen = new Set<string>();

    for (const key in choices) {
        if (Object.prototype.hasOwnProperty.call(choices, key)) {
            const text = choices[key].text.trim();

            if (!seen.has(text) && text !== '') {
                newObj[key] = choices[key];
                seen.add(text);
            }
        }
    }

    return newObj;
}

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
