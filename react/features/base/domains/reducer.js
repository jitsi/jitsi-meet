// @flow

import { ReducerRegistry } from '../redux';
import { PersistenceRegistry } from '../storage';

import { ADD_KNOWN_DOMAINS } from './actionTypes';

const DEFAULT_STATE = [];

const STORE_NAME = 'features/base/domains';

PersistenceRegistry.register(STORE_NAME);

ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case ADD_KNOWN_DOMAINS:
        return _addKnownDomain(state, action);

    default:
        return state;
    }
});

/**
 * Adds an array of new domains to the known domain list if not present yet.
 *
 * @param {Object} state - The redux state.
 * @param {Object} action - The redux action.
 * @private
 * @returns {Object}
 */
function _addKnownDomain(state, action) {
    const { knownDomains: knownDomainsToAdd } = action;
    const knownDomains = Array.from(state);

    if (Array.isArray(knownDomainsToAdd)) {
        for (let knownDomain of knownDomainsToAdd) {
            knownDomain = knownDomain.toLowerCase();

            if (knownDomains.indexOf(knownDomain) === -1) {
                knownDomains.push(knownDomain);
            }
        }

        return knownDomains;
    }

    return state;
}
