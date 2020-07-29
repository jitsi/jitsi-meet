/**
 * Returns "last N" value which corresponds to a level defined in the {@code lastNLimits} mapping. See
 * {@code config.js} for more detailed explanation on how the mapping is defined.
 *
 * @param {number} participantsCount - The current number of participants in the conference.
 * @param {Object} [lastNLimits] - The mapping of number of participants to "last N" values.
 * @returns {number|undefined} - A "last N" number if {@code lastNLimits} describes a valid mapping and if there was
 * a corresponding "last N" matched with the number of participants or {@code undefined} otherwise.
 */
export function limitLastN(participantsCount, lastNLimits) {
    // Checks if only numbers are used
    if (typeof lastNLimits !== 'object'
        || !Object.keys(lastNLimits).length
        || Object.keys(lastNLimits)
            .find(limit => limit === null || isNaN(Number(limit))
                    || lastNLimits[limit] === null || isNaN(Number(lastNLimits[limit])))) {
        return undefined;
    }

    // Converts to numbers and sorts the keys
    const orderedLimits = Object.keys(lastNLimits)
        .map(n => Number(n))
        .sort((n1, n2) => n1 - n2);

    let selectedLimit;

    for (const participantsN of orderedLimits) {
        if (participantsCount >= participantsN) {
            selectedLimit = participantsN;
        }
    }

    return selectedLimit ? Number(lastNLimits[selectedLimit]) : undefined;
}
