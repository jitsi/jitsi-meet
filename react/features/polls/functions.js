// @flow

/**
 * Filter out duplicate items.
 *
 * @param {Array<Object>} items - Array of Poll items.
 * @returns {Array<Object>}
 */
export function getUniquePollItems(items: Array<Object>): Array<Object> {
    const seen = new Set<string>();

    return items.filter(x => {
        const added = seen.has(x.text) ? false : seen.add(x.text);

        return added;
    });
}
