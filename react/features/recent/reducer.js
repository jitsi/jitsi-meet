import _ from 'lodash';

import { ReducerRegistry, set } from '../base/redux';
import { ADD_RECENT_URL, LOADED_RECENT_URLS } from './actionTypes';

const MAX_LENGTH = 25;

const INITIAL_STATE = {
    entries: []
};

/**
 * Reduces the Redux actions of the feature features/recording.
 */
ReducerRegistry.register('features/recent', (state = INITIAL_STATE, action) => {
    switch (action.type) {
    case LOADED_RECENT_URLS: {
        // FIXME if that happens too late it may overwrite any recent URLs
        const newState = set(state, 'entries', action.entries);

        console.info('RECENT STATE ON LOAD: ', newState);

        return newState;
    }
    case ADD_RECENT_URL: {
        return _addRecentUrl(state, action);
    }
    default:
        return state;
    }
});

/**
 * FIXME.
 * @param state
 * @param action
 * @returns {Object}
 * @private
 */
function _addRecentUrl(state, action) {
    const { roomURL, timestamp } = action;
    let existingIdx = -1;
    const entries = _.cloneDeep(state.entries);

    for (let i = 0; i < entries.length; i++) {
        if (entries[i].roomURL === roomURL) {
            existingIdx = i;
            break;
        }
    }

    if (existingIdx !== -1) {
        console.info('DELETED ALREADY EXISTING', roomURL);
        entries.splice(existingIdx, 1);
    }

    entries.unshift({
        roomURL,
        timestamp
    });

    if (entries.length > MAX_LENGTH) {
        const removed = entries.pop();

        console.info('SIZE LIMIT exceeded, removed:', removed);
    }

    const newState = set(state, 'entries', entries);

    console.info('RECENT URLs', newState);

    window.localStorage.setItem('recentURLs', JSON.stringify(entries));

    return newState;
}
