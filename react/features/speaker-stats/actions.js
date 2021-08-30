// @flow

import {
    INIT_SEARCH,
    INIT_UPDATE_STATS,
    UPDATE_STATS,
    REORDER_STATS
} from './actionTypes';

/**
 * Starts a search by criteria.
 *
 * @param {string} criteria - The search criteria.
 * @returns {Function}
 */
export function initSearch(criteria: string) {
    return {
        type: INIT_SEARCH,
        criteria
    };
}

/**
 * Gets the new stats and triggers update.
 *
 * @param {boolean} reorder - Should reorder or not.
 * @returns {Function}
 */
export function initUpdateStats(reorder: boolean = false) {
    return {
        type: INIT_UPDATE_STATS,
        reorder
    };
}

/**
 * Updates the stats with new stats.
 *
 * @param {Object} stats - The new stats.
 * @returns {Function}
 */
export function updateStats(stats: Object) {
    return {
        type: UPDATE_STATS,
        stats
    };
}

/**
 * Reorders the stats with new stats.
 *
 * @param {Object} stats - The new stats.
 * @returns {Function}
 */
export function reorderStats(stats: Object) {
    return {
        type: REORDER_STATS,
        stats
    };
}
