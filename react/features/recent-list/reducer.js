// @flow

import {
    STORE_CURRENT_CONFERENCE,
    UPDATE_CONFERENCE_DURATION
} from './actionTypes';
import { LIST_SIZE } from './constants';

import { PersistencyRegistry, ReducerRegistry } from '../base/redux';

/**
 * The initial state of this feature.
 */
const DEFAULT_STATE = {
    list: []
};

/**
 * The Redux subtree of this feature.
 */
const STORE_NAME = 'features/recent-list';

/**
 * Registers the redux store subtree of this feature for persistency.
 */
PersistencyRegistry.register(STORE_NAME, {
    list: true
});

/**
 * Reduces the Redux actions of the feature features/recent-list.
 */
ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case STORE_CURRENT_CONFERENCE:
        return _storeCurrentConference(state, action);
    case UPDATE_CONFERENCE_DURATION:
        return _updateConferenceDuration(state, action);
    default:
        return state;
    }
});

/**
* Adds a new list entry to the redux store.
*
* @param {Object} state - The redux state.
* @param {Object} action - The redux action.
* @returns {Object}
*/
function _storeCurrentConference(state, action) {
    const { locationURL } = action;
    const conference = locationURL.href;

    // If the current conference is already in the list, we remove it to re-add
    // it to the top.
    const list
        = state.list
            .filter(e => e.conference !== conference);

    // This is a reverse sorted array (i.e. newer elements at the end).
    list.push({
        conference,
        conferenceDuration: 0, // we don't have this data yet
        date: Date.now()
    });

    // maximising the size
    list.splice(0, list.length - LIST_SIZE);

    return {
        list
    };
}

/**
 * Updates the conference length when left.
 *
 * @param {Object} state - The redux state.
 * @param {Object} action - The redux action.
 * @returns {Object}
 */
function _updateConferenceDuration(state, action) {
    const { locationURL } = action;

    if (locationURL && locationURL.href) {
        const list = state.list;

        if (list.length > 0) {
            const mostRecentURL = list[list.length - 1];

            if (mostRecentURL.conference === locationURL.href) {
                // The last conference start was stored so we need to update the
                // length.
                mostRecentURL.conferenceDuration
                    = Date.now() - mostRecentURL.date;

                return {
                    list
                };
            }
        }
    }

    return state;
}
