import ReducerRegistry from '../../base/redux/ReducerRegistry';
import { assign } from '../../base/redux/functions';

import { SET_CONFERENCE_TIMESTAMP, SET_SESSION_ID, SET_WATCH_REACHABLE } from './actionTypes';

export interface IMobileWatchOSState {
    conferenceTimestamp?: number;
    sessionID: number;
    watchReachable?: boolean;
}

const INITIAL_STATE = {
    sessionID: new Date().getTime()
};

/**
 * Reduces the Redux actions of the feature features/mobile/watchos.
 */
ReducerRegistry.register<IMobileWatchOSState>('features/mobile/watchos',
(state = INITIAL_STATE, action): IMobileWatchOSState => {
    switch (action.type) {
    case SET_CONFERENCE_TIMESTAMP: {
        return assign(state, {
            conferenceTimestamp: action.conferenceTimestamp
        });
    }
    case SET_SESSION_ID: {
        return assign(state, {
            sessionID: action.sessionID,
            conferenceTimestamp: 0
        });
    }
    case SET_WATCH_REACHABLE: {
        return assign(state, {
            watchReachable: action.watchReachable
        });
    }
    default:
        return state;
    }
});
