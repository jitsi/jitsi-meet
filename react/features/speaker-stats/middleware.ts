import { batch } from 'react-redux';
import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import {
    PARTICIPANT_JOINED,
    PARTICIPANT_KICKED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import {
    ADD_TO_OFFSET,
    INIT_SEARCH,
    INIT_UPDATE_STATS,
    RESET_SEARCH_CRITERIA
} from './actionTypes';
import {
    clearTimelineBoundary,
    initReorderStats,
    setTimelineBoundary,
    updateSortedSpeakerStatsIds,
    updateStats
} from './actions.any';
import { CLEAR_TIME_BOUNDARY_THRESHOLD } from './constants';
import {
    filterBySearchCriteria,
    getCurrentDuration,
    getPendingReorder,
    getSortedSpeakerStatsIds,
    getTimelineBoundaries,
    resetHiddenStats
} from './functions';

MiddlewareRegistry.register(({ dispatch, getState }: IStore) => (next: Function) => (action: AnyAction) => {
    switch (action.type) {
    case INIT_SEARCH: {
        const state = getState();
        const stats = filterBySearchCriteria(state);

        dispatch(updateStats(stats));
        break;
    }

    case INIT_UPDATE_STATS:
        if (action.getSpeakerStats) {
            const state = getState();
            const speakerStats = { ...action.getSpeakerStats() };
            const stats = filterBySearchCriteria(state, speakerStats);
            const pendingReorder = getPendingReorder(state);

            batch(() => {
                if (pendingReorder) {
                    dispatch(updateSortedSpeakerStatsIds(getSortedSpeakerStatsIds(state, stats) ?? []));
                }

                dispatch(updateStats(stats));
            });

        }

        break;

    case RESET_SEARCH_CRITERIA: {
        const state = getState();
        const stats = resetHiddenStats(state);

        dispatch(updateStats(stats));
        break;
    }
    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT:
    case PARTICIPANT_KICKED:
    case PARTICIPANT_UPDATED: {
        const { pendingReorder } = getState()['features/speaker-stats'];

        if (!pendingReorder) {
            dispatch(initReorderStats());
        }
        break;
    }

    case ADD_TO_OFFSET: {
        const state = getState();
        const { timelineBoundary } = state['features/speaker-stats'];
        const { right } = getTimelineBoundaries(state);
        const currentDuration = getCurrentDuration(state) ?? 0;

        if (Math.abs((right + action.value) - currentDuration) < CLEAR_TIME_BOUNDARY_THRESHOLD) {
            dispatch(clearTimelineBoundary());
        } else if (!timelineBoundary) {
            dispatch(setTimelineBoundary(currentDuration ?? 0));
        }

        break;
    }
    }

    return next(action);
});
