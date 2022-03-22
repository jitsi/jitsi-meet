// @flow

import {
    PARTICIPANT_JOINED,
    PARTICIPANT_KICKED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants/actionTypes';
import { MiddlewareRegistry } from '../base/redux';

import {
    INIT_SEARCH,
    INIT_UPDATE_STATS,
    RESET_SEARCH_CRITERIA
} from './actionTypes';
import { initReorderStats, updateStats } from './actions';
import { filterBySearchCriteria, getSortedSpeakerStats, getPendingReorder, resetHiddenStats } from './functions';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

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

            dispatch(updateStats(pendingReorder ? getSortedSpeakerStats(state, stats) : stats));
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
        dispatch(initReorderStats());

        break;
    }
    }

    return result;
});
