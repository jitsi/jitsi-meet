import { IStore } from '../app/types';

import {
    ADD_TO_OFFSET,
    ADD_TO_OFFSET_LEFT,
    ADD_TO_OFFSET_RIGHT,
    INIT_REORDER_STATS,
    INIT_SEARCH,
    INIT_UPDATE_STATS,
    RESET_SEARCH_CRITERIA,
    SET_PANNING,
    SET_TIMELINE_BOUNDARY,
    TOGGLE_FACE_EXPRESSIONS,
    UPDATE_SORTED_SPEAKER_STATS_IDS,
    UPDATE_STATS
} from './actionTypes';
import { MINIMUM_INTERVAL } from './constants';
import { getCurrentDuration, getTimelineBoundaries } from './functions';
import { ISpeakerStats } from './reducer';

/**
 * Starts a search by criteria.
 *
 * @param {string} criteria - The search criteria.
 * @returns {Object}
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
 * @param {Function} getSpeakerStats - Function to get the speaker stats.
 * @returns {Object}
 */
export function initUpdateStats(getSpeakerStats: () => ISpeakerStats) {
    return {
        type: INIT_UPDATE_STATS,
        getSpeakerStats
    };
}

/**
 * Updates the stats with new stats.
 *
 * @param {Object} stats - The new stats.
 * @returns {Object}
 */
export function updateStats(stats: Object) {
    return {
        type: UPDATE_STATS,
        stats
    };
}

/**
 * Updates the speaker stats order.
 *
 * @param {Array<string>} participantIds - Participant ids.
 * @returns {Object}
 */
export function updateSortedSpeakerStatsIds(participantIds: Array<string>) {
    return {
        type: UPDATE_SORTED_SPEAKER_STATS_IDS,
        participantIds
    };
}

/**
 * Initiates reordering of the stats.
 *
 * @returns {Object}
 */
export function initReorderStats() {
    return {
        type: INIT_REORDER_STATS
    };
}

/**
 * Resets the search criteria.
 *
 * @returns {Object}
 */
export function resetSearchCriteria() {
    return {
        type: RESET_SEARCH_CRITERIA
    };
}

/**
 * Toggles the face expressions grid.
 *
 * @returns {Object}
 */
export function toggleFaceExpressions() {
    return {
        type: TOGGLE_FACE_EXPRESSIONS
    };
}

/**
 * Adds a value to the boundary offset of the timeline.
 *
 * @param {number} value - The value to be added.
 * @param {number} left - The left boundary.
 * @param {number} right - The right boundary.
 * @param {number} currentDuration - The currentDuration of the conference.
 * @returns {Object}
 */
export function addToOffset(value: number) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { left, right } = getTimelineBoundaries(state);
        const currentDuration = getCurrentDuration(state) ?? 0;
        const newLeft = left + value;
        const newRight = right + value;

        if (newLeft >= 0 && newRight <= currentDuration) {
            dispatch({
                type: ADD_TO_OFFSET,
                value
            });
        } else if (newLeft < 0) {
            dispatch({
                type: ADD_TO_OFFSET,
                value: -left
            });
        } else if (newRight > currentDuration) {
            dispatch({
                type: ADD_TO_OFFSET,
                value: currentDuration - right
            });
        }
    };
}

/**
 * Adds the value to the offset of the left boundary for the timeline.
 *
 * @param {number} value - The new value for the offset.
 * @returns {Object}
 */
export function addToOffsetLeft(value: number) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { left, right } = getTimelineBoundaries(state);
        const newLeft = left + value;

        if (newLeft >= 0 && right - newLeft > MINIMUM_INTERVAL) {
            dispatch({
                type: ADD_TO_OFFSET_LEFT,
                value
            });
        } else if (newLeft < 0) {
            dispatch({
                type: ADD_TO_OFFSET_LEFT,
                value: -left
            });
        }
    };
}

/**
 * Adds the value to the offset of the right boundary for the timeline.
 *
 * @param {number} value - The new value for the offset.
 * @returns {Object}
 */
export function addToOffsetRight(value: number) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { left, right } = getTimelineBoundaries(state);
        const currentDuration = getCurrentDuration(state) ?? 0;
        const newRight = right + value;

        if (newRight <= currentDuration && newRight - left > MINIMUM_INTERVAL) {
            dispatch({
                type: ADD_TO_OFFSET_RIGHT,
                value
            });
        } else if (newRight > currentDuration) {
            dispatch({
                type: ADD_TO_OFFSET_RIGHT,
                value: currentDuration - right
            });
        }
    };
}

/**
 * Sets the current time boundary of the timeline, when zoomed in.
 *
 * @param {number} boundary - The current time boundary.
 * @returns {Object}
 */
export function setTimelineBoundary(boundary: number) {
    return {
        type: SET_TIMELINE_BOUNDARY,
        boundary
    };
}

/**
 * Clears the current time boundary of the timeline, when zoomed out full.
 *
 * @returns {Object}
 */
export function clearTimelineBoundary() {
    return {
        type: SET_TIMELINE_BOUNDARY,
        boundary: null
    };
}

/**
 * Sets the state of the timeline panning.
 *
 * @param {Object} panning - The state of the timeline panning.
 * @returns {Object}
 */
export function setTimelinePanning(panning: { active: boolean; x: number; }) {
    return {
        type: SET_PANNING,
        panning
    };
}
