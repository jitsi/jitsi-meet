/**
 * Validates the lastNLimits config and converts it into a Map with sorted numeric keys, or returns undefined
 * if it is not usable.
 *
 * @param {Object} lastNLimits - The lastNLimits config value, participant count to lastN.
 * @returns {Map<number, number>|undefined} The sorted mapping.
 */
export function validateLastNLimits(lastNLimits?: Record<string, number | string>): Map<number, number> | undefined {
    // Checks if only numbers are used
    if (typeof lastNLimits !== 'object'
        || !Object.keys(lastNLimits).length
        || Object.keys(lastNLimits)
            .find(limit => limit === null || isNaN(Number(limit))
                || lastNLimits[limit] === null || isNaN(Number(lastNLimits[limit])))) {
        return undefined;
    }

    // Converts to numbers and sorts the keys
    const sortedMapping = new Map<number, number>();
    const orderedLimits = Object.keys(lastNLimits)
        .map(n => Number(n))
        .sort((n1, n2) => n1 - n2);

    for (const limit of orderedLimits) {
        sortedMapping.set(limit, Number(lastNLimits[limit]));
    }

    return sortedMapping;
}

/**
 * Returns the lastN value to use for the given number of participants, according to the (validated) limits.
 *
 * @param {number} participantsCount - The number of participants in the conference.
 * @param {Map<number, number>|undefined} lastNLimits - The mapping produced by validateLastNLimits.
 * @returns {number|undefined} The lastN limit, or undefined if none applies.
 */
export function limitLastN(participantsCount: number, lastNLimits?: Map<number, number>): number | undefined {
    if (!lastNLimits?.keys) {
        return undefined;
    }

    let selectedLimit: number | undefined;

    for (const participantsN of lastNLimits.keys()) {
        if (participantsCount >= participantsN) {
            selectedLimit = participantsN;
        }
    }

    return selectedLimit === undefined ? undefined : lastNLimits.get(selectedLimit);
}
