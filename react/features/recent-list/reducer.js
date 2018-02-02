// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import {
    STORE_CURRENT_CONFERENCE,
    UPDATE_CONFERENCE_DURATION
} from './actionTypes';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * The name of the {@code window.localStorage} item where recent rooms are
 * stored.
 *
 * @type {string}
 */
const LEGACY_STORAGE_KEY = 'recentURLs';

/**
 * The max size of the list.
 *
 * @type {number}
 */
export const MAX_LIST_SIZE = 30;

/**
 * The redux subtree of this feature.
 */
const STORE_NAME = 'features/recent-list';

/**
 * Sets up the persistence of the feature recent-list.
 */
PersistenceRegistry.register(STORE_NAME, {
    list: true
});

/**
 * Reduces the redux actions of the feature recent-list.
 */
ReducerRegistry.register(
    STORE_NAME,
    (state = { list: _getLegacyRecentRoomList() }, action) => {
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
 * Retrieves the recent room list that was stored using the legacy way.
 *
 * @returns {Array<Object>}
 */
export function _getLegacyRecentRoomList(): Array<Object> {
    try {
        const list
            = JSON.parse(window.localStorage.getItem(LEGACY_STORAGE_KEY));

        if (list && list.length) {
            return list;
        }
    } catch (error) {
        logger.warn('Failed to parse legacy recent-room list!');
    }

    return [];
}

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
    const list = state.list.filter(e => e.conference !== conference);

    // The list is a reverse-sorted (i.e. the newer elements are at the end).
    list.push({
        conference,
        conferenceDuration: 0, // We don't have this data yet!
        date: Date.now()
    });

    // Ensure the list doesn't exceed a/the maximum size.
    list.splice(0, list.length - MAX_LIST_SIZE);

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
