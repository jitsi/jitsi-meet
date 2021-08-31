// @flow

import {
    PARTICIPANT_JOINED,
    PARTICIPANT_KICKED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants/actionTypes';
import { MiddlewareRegistry } from '../base/redux';

import { INIT_SEARCH, INIT_UPDATE_STATS } from './actionTypes';
import { reorderStats, updateStats } from './actions';
import { SPEAKER_STATS_RELOAD_INTERVAL } from './constants';
import { filterBySearchCriteria, getSortedSpeakerStats } from './functions';

declare var APP: Object;

let reorderTimeoutHandle;

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
    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT:
    case PARTICIPANT_KICKED:
    case PARTICIPANT_UPDATED: {
        let reorderFlag = true;

        if (action.type === INIT_UPDATE_STATS && action.getSpeakerStats) {
            const state = getState();
            const speakerStats = { ...action.getSpeakerStats() };
            const stats = filterBySearchCriteria(state, speakerStats);

            dispatch(updateStats(stats));

            reorderFlag = Boolean(action.reorder);
        }

        if (reorderFlag) {
            clearTimeout(reorderTimeoutHandle);
            reorderTimeoutHandle = setTimeout(() => {
                const newState = getState();

                dispatch(reorderStats(getSortedSpeakerStats(newState)));
            }, SPEAKER_STATS_RELOAD_INTERVAL);
        }

        break;
    }
    }

    return result;
});
