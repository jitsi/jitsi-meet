// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import {
    CALENDAR_ACCESS_REQUESTED,
    NEW_CALENDAR_ENTRY_LIST,
    NEW_KNOWN_DOMAIN
} from './actionTypes';

const DEFAULT_STATE = {
    /**
     * Note: If features/calendar-sync ever gets persisted, do not persist the
     * calendarAccessStatus value as it's needed to remain a runtime value to
     * see if we need to re-request the calendar permission from the user.
     */
    calendarAccessStatus: undefined,
    events: [],
    knownDomains: []
};

const MAX_DOMAIN_LIST_SIZE = 10;

const STORE_NAME = 'features/calendar-sync';

PersistenceRegistry.register(STORE_NAME, {
    knownDomains: true
});

ReducerRegistry.register(
    STORE_NAME,
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case CALENDAR_ACCESS_REQUESTED:
            return {
                ...state,
                calendarAccessStatus: action.status
            };

        case NEW_CALENDAR_ENTRY_LIST:
            return {
                ...state,
                events: action.events
            };

        case NEW_KNOWN_DOMAIN:
            return _maybeAddNewDomain(state, action);

        default:
            return state;
        }
    });

/**
 * Adds a new domain to the known domain list if not present yet.
 *
 * @private
 * @param {Object} state - The redux state.
 * @param {Object} action - The redux action.
 * @returns {Object}
 */
function _maybeAddNewDomain(state, action) {
    let { domainName } = action;
    const { knownDomains } = state;

    if (domainName && domainName.length) {
        domainName = domainName.toLowerCase();
        if (knownDomains.indexOf(domainName) === -1) {
            knownDomains.push(domainName);

            // Ensure the list doesn't exceed a/the maximum size.
            knownDomains.splice(0, knownDomains.length - MAX_DOMAIN_LIST_SIZE);
        }
    }

    return {
        ...state,
        knownDomains
    };
}
