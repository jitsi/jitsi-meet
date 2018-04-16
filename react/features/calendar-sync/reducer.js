// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import {
    ADD_KNOWN_DOMAIN,
    SET_CALENDAR_AUTHORIZATION,
    SET_CALENDAR_EVENTS
} from './actionTypes';
import { CALENDAR_ENABLED } from './constants';

const DEFAULT_STATE = {
    /**
     * Note: If features/calendar-sync ever gets persisted, do not persist the
     * authorization value as it's needed to remain a runtime value to see if we
     * need to re-request the calendar permission from the user.
     */
    authorization: undefined,
    events: [],
    knownDomains: []
};

const MAX_DOMAIN_LIST_SIZE = 10;

const STORE_NAME = 'features/calendar-sync';

CALENDAR_ENABLED
    && PersistenceRegistry.register(STORE_NAME, {
        knownDomains: true
    });

CALENDAR_ENABLED
    && ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case ADD_KNOWN_DOMAIN:
            return _addKnownDomain(state, action);

        case SET_CALENDAR_AUTHORIZATION:
            return {
                ...state,
                authorization: action.status
            };

        case SET_CALENDAR_EVENTS:
            return {
                ...state,
                events: action.events
            };

        default:
            return state;
        }
    });

/**
 * Adds a new domain to the known domain list if not present yet.
 *
 * @param {Object} state - The redux state.
 * @param {Object} action - The redux action.
 * @private
 * @returns {Object}
 */
function _addKnownDomain(state, action) {
    let { knownDomain } = action;

    if (knownDomain) {
        knownDomain = knownDomain.toLowerCase();

        let { knownDomains } = state;

        if (knownDomains.indexOf(knownDomain) === -1) {
            // Add the specified known domain and at the same time avoid
            // modifying the knownDomains Array instance referenced by the
            // current redux state.
            knownDomains = [
                ...state.knownDomains,
                knownDomain
            ];

            // Ensure the list doesn't exceed a/the maximum size.
            knownDomains.splice(0, knownDomains.length - MAX_DOMAIN_LIST_SIZE);

            return {
                ...state,
                knownDomains
            };
        }
    }

    return state;
}
