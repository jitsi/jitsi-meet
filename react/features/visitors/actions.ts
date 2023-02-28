import { I_AM_VISITOR_MODE, UPDATE_VISITORS_COUNT } from './actionTypes';

/**
 * Sets Visitors mode on or off.
 *
 * @param {boolean} enabled - The new visitors mode state.
 * @returns {{
 *     type: I_AM_VISITOR_MODE,
 * }}
 */
export function setIAmVisitor(enabled: boolean) {
    return {
        type: I_AM_VISITOR_MODE,
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
