import { assign } from 'lodash-es';

import ReducerRegistry from '../base/redux/ReducerRegistry';
import { FaceLandmarks } from '../face-landmarks/types';

import {
    ADD_TO_OFFSET,
    ADD_TO_OFFSET_LEFT,
    ADD_TO_OFFSET_RIGHT,
    INIT_REORDER_STATS,
    INIT_SEARCH,
    RESET_SEARCH_CRITERIA,
    SET_PANNING,
    SET_TIMELINE_BOUNDARY,
    TOGGLE_FACE_EXPRESSIONS,
    UPDATE_SORTED_SPEAKER_STATS_IDS,
    UPDATE_STATS
} from './actionTypes';

/**
 * The initial state of the feature speaker-stats.
 *
 * @type {Object}
 */
const INITIAL_STATE = {
    stats: {},
    isOpen: false,
    pendingReorder: true,
    criteria: null,
    showFaceExpressions: false,
    sortedSpeakerStatsIds: [],
    timelineBoundary: null,
    offsetLeft: 0,
    offsetRight: 0,
    timelinePanning: {
        active: false,
        x: 0
    }
};

export interface ISpeaker {
    addFaceLandmarks: (faceLandmarks: FaceLandmarks) => void;
    displayName?: string;
    getDisplayName: () => string;
    getFaceLandmarks: () => FaceLandmarks[];
    getTotalDominantSpeakerTime: () => number;
    getUserId: () => string;
    hasLeft: () => boolean;
    hidden?: boolean;
    isDominantSpeaker: () => boolean;
    isLocalStats: () => boolean;
    isModerator?: boolean;
    markAsHasLeft: () => boolean;
    setDisplayName: (newName: string) => void;
    setDominantSpeaker: (isNowDominantSpeaker: boolean, silence: boolean) => void;
    setFaceLandmarks: (faceLandmarks: FaceLandmarks[]) => void;
}

export interface ISpeakerStats {
    [key: string]: ISpeaker;
}

export interface ISpeakerStatsState {
    criteria: string | null;
    isOpen: boolean;
    offsetLeft: number;
    offsetRight: number;
    pendingReorder: boolean;
    showFaceExpressions: boolean;
    sortedSpeakerStatsIds: Array<string>;
    stats: ISpeakerStats;
    timelineBoundary: number | null;
    timelinePanning: {
        active: boolean;
        x: number;
    };
}

ReducerRegistry.register<ISpeakerStatsState>('features/speaker-stats',
(state = INITIAL_STATE, action): ISpeakerStatsState => {
    switch (action.type) {
    case INIT_SEARCH:
        return _updateCriteria(state, action);
    case UPDATE_STATS:
        return _updateStats(state, action);
    case INIT_REORDER_STATS:
        return _initReorderStats(state);
    case UPDATE_SORTED_SPEAKER_STATS_IDS:
        return _updateSortedSpeakerStats(state, action);
    case RESET_SEARCH_CRITERIA:
        return _updateCriteria(state, { criteria: null });
    case TOGGLE_FACE_EXPRESSIONS: {
        return {
            ...state,
            showFaceExpressions: !state.showFaceExpressions
        };
    }
    case ADD_TO_OFFSET: {
        return {
            ...state,
            offsetLeft: state.offsetLeft + action.value,
            offsetRight: state.offsetRight + action.value
        };
    }
    case ADD_TO_OFFSET_RIGHT: {
        return {
            ...state,
            offsetRight: state.offsetRight + action.value
        };
    }
    case ADD_TO_OFFSET_LEFT: {
        return {
            ...state,
            offsetLeft: state.offsetLeft + action.value
        };
    }
    case SET_TIMELINE_BOUNDARY: {
        return {
            ...state,
            timelineBoundary: action.boundary
        };
    }
    case SET_PANNING: {
        return {
            ...state,
            timelinePanning: action.panning
        };
    }
    }

    return state;
});

/**
 * Reduces a specific Redux action INIT_SEARCH of the feature
 * speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @param {Action} action - The Redux action INIT_SEARCH to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _updateCriteria(state: ISpeakerStatsState, { criteria }: { criteria: string | null; }) {
    return assign({}, state, { criteria });
}

/**
 * Reduces a specific Redux action UPDATE_STATS of the feature speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @param {Action} action - The Redux action UPDATE_STATS to reduce.
 * @private
 * @returns {Object} - The new state after the reduction of the specified action.
 */
function _updateStats(state: ISpeakerStatsState, { stats }: { stats: any; }) {
    return {
        ...state,
        stats
    };
}

/**
 * Reduces a specific Redux action UPDATE_SORTED_SPEAKER_STATS_IDS of the feature speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @param {Action} action - The Redux action UPDATE_SORTED_SPEAKER_STATS_IDS to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _updateSortedSpeakerStats(state: ISpeakerStatsState, { participantIds }: { participantIds: Array<string>; }) {
    return {
        ...state,
        sortedSpeakerStatsIds: participantIds,
        pendingReorder: false
    };
}

/**
 * Reduces a specific Redux action INIT_REORDER_STATS of the feature
 * speaker-stats.
 *
 * @param {Object} state - The Redux state of the feature speaker-stats.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _initReorderStats(state: ISpeakerStatsState) {
    return assign({}, state, { pendingReorder: true });
}
