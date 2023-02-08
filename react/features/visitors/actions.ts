import { UPDATE_VISITORS_COUNT, VISITORS_MODE_ENABLED } from './actionTypes';

/**
 * Sets Visitors mode on or off.
 *
 * @param {boolean} enabled - The new visitors mode state.
 * @returns {{
 *     type: VISITORS_MODE_ENABLED,
 * }}
 */
export function setVisitorsMode(enabled: boolean) {
    return {
        type: VISITORS_MODE_ENABLED,
        enabled
    };
}

/**
 * Visitors count has been updated.
 *
 * @param {number} count - The new visitors count.
 * @returns {{
 *     type: UPDATE_VISITORS_COUNT,
 * }}
 */
export function updateVisitorsCount(count: number) {
    return {
        type: UPDATE_VISITORS_COUNT,
        count
    };
}
