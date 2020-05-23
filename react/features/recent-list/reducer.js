// @flow

import { jitsiLocalStorage } from 'js-utils';

import { APP_WILL_MOUNT } from '../base/app';
import { getURLWithoutParamsNormalized } from '../base/connection';
import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import {
    _STORE_CURRENT_CONFERENCE,
    _UPDATE_CONFERENCE_DURATION,
    DELETE_RECENT_LIST_ENTRY
} from './actionTypes';
import { isRecentListEnabled } from './functions';
import logger from './logger';

/**
 * The default/initial redux state of the feature {@code recent-list}.
 *
 * @type {Array<Object>}
 */
const DEFAULT_STATE = [];

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
 * Sets up the persistence of the feature {@code recent-list}.
 */
PersistenceRegistry.register(STORE_NAME);

/**
 * Reduces redux actions for the purposes of the feature {@code recent-list}.
 */
ReducerRegistry.register(
    STORE_NAME,
    (state = _getLegacyRecentRoomList(), action) => {
        if (isRecentListEnabled()) {
            switch (action.type) {
            case APP_WILL_MOUNT:
                return _appWillMount(state);
            case DELETE_RECENT_LIST_ENTRY:
                return _deleteRecentListEntry(state, action.entryId);
            case _STORE_CURRENT_CONFERENCE:
                return _storeCurrentConference(state, action);

            case _UPDATE_CONFERENCE_DURATION:
                return _updateConferenceDuration(state, action);
            default:
                return state;
            }
        }

        return state;
    });

/**
 * Deletes a recent list entry based on the url and date of the item.
 *
 * @param {Array<Object>} state - The Redux state.
 * @param {Object} entryId - The ID object of the entry.
 * @returns {Array<Object>}
 */
function _deleteRecentListEntry(
        state: Array<Object>, entryId: Object): Array<Object> {
    return state.filter(entry =>
        entry.conference !== entryId.url || entry.date !== entryId.date);
}

/**
 * Reduces the redux action {@link APP_WILL_MOUNT}.
 *
 * @param {Object} state - The redux state of the feature {@code recent-list}.
 * @param {Action} action - The redux action {@code APP_WILL_MOUNT}.
 * @returns {Array<Object>} The next redux state of the feature
 * {@code recent-list}.
 */
function _appWillMount(state) {
    // XXX APP_WILL_MOUNT is the earliest redux action of ours dispatched in the
    // store. For the purposes of legacy support, make sure that the
    // deserialized recent-list's state is in the format deemed current by the
    // current app revision.
    if (state && typeof state === 'object') {
        if (Array.isArray(state)) {
            return state;
        }

        // In an enterprise/internal build of Jitsi Meet for Android and iOS we
        // had recent-list's state as an object with property list.
        const { list } = state;

        if (Array.isArray(list) && list.length) {
            return list.slice();
        }
    }

    // In the weird case that we have previously persisted/serialized null.
    return DEFAULT_STATE;
}

/**
 * Retrieves the recent room list that was stored using the legacy way.
 *
 * @returns {Array<Object>}
 */
function _getLegacyRecentRoomList(): Array<Object> {
    const str = jitsiLocalStorage.getItem(LEGACY_STORAGE_KEY);

    if (str) {
        try {
            return JSON.parse(str);
        } catch (error) {
            logger.warn('Failed to parse legacy recent-room list!');
        }
    }


    return [];
}

/**
 * Adds a new list entry to the redux store.
 *
 * @param {Object} state - The redux state of the feature {@code recent-list}.
 * @param {Object} action - The redux action.
 * @returns {Object}
 */
function _storeCurrentConference(state, { locationURL }) {
    const conference = locationURL.href;

    // If the current conference is already in the list, we remove it to re-add
    // it to the top.
    const nextState
        = state.filter(e => !_urlStringEquals(e.conference, conference));

    // The list is a reverse-sorted (i.e. the newer elements are at the end).
    nextState.push({
        conference,
        date: Date.now(),
        duration: 0 // We don't have the duration yet!
    });

    // Ensure the list doesn't exceed a/the maximum size.
    nextState.splice(0, nextState.length - MAX_LIST_SIZE);

    return nextState;
}

/**
 * Updates the conference length when left.
 *
 * @param {Object} state - The redux state of the feature {@code recent-list}.
 * @param {Object} action - The redux action.
 * @returns {Object} The next redux state of the feature {@code recent-list}.
 */
function _updateConferenceDuration(state, { locationURL }) {
    if (locationURL && locationURL.href && state.length) {
        const mostRecentIndex = state.length - 1;
        const mostRecent = state[mostRecentIndex];

        if (_urlStringEquals(mostRecent.conference, locationURL.href)) {
            // The last conference start was stored so we need to update the
            // length.
            const nextMostRecent = {
                ...mostRecent,
                duration: Date.now() - mostRecent.date
            };

            delete nextMostRecent.conferenceDuration; // legacy

            // Shallow copy to avoid in-place modification.
            const nextState = state.slice();

            nextState[mostRecentIndex] = nextMostRecent;

            return nextState;
        }
    }

    return state;
}

/**
 * Determines whether two specific URL {@code strings} are equal in the sense
 * that they identify one and the same conference resource (irrespective of
 * time) for the purposes of the feature {@code recent-list}.
 *
 * @param {string} a - The URL {@code string} to test for equality to {@code b}.
 * @param {string} b - The URL {@code string} to test for equality to {@code a}.
 * @returns {boolean}
 */
function _urlStringEquals(a: string, b: string) {
    const aHref = getURLWithoutParamsNormalized(new URL(a));
    const bHref = getURLWithoutParamsNormalized(new URL(b));

    return aHref === bHref;
}
