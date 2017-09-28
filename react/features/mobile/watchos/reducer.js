import { ReducerRegistry, set } from '../../base/redux';
import {
    SET_CONFERENCE_URL, SET_MIC_MUTED,
    SET_RECENT_URLS
} from './actionTypes';

const INITIAL_STATE = {
    // NOTE for some reason 'null' does not update context
    conferenceURL: 'NULL',
    micMuted: false,
    recentURLs: []
};

/**
 * Reduces the Redux actions of the feature features/recording.
 */
ReducerRegistry.register(
'features/mobile/watchos', (state = INITIAL_STATE, action) => {
    switch (action.type) {
    case SET_CONFERENCE_URL: {
        return set(state, 'conferenceURL', action.conferenceURL);
    }
    case SET_MIC_MUTED: {
        return set(state, 'micMuted', action.micMuted);
    }
    case SET_RECENT_URLS: {
        return set(state, 'recentURLs', action.recentURLs);
    }
    default:
        return state;
    }
});
