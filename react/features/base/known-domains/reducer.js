// @flow

import { APP_WILL_MOUNT } from '../app/actionTypes';
import { PersistenceRegistry, ReducerRegistry } from '../redux';

import { ADD_KNOWN_DOMAINS } from './actionTypes';

/**
 * The default list of domains known to the feature base/known-domains.
 * Generally, it should be in sync with the domains associated with the app
 * through its manifest (in other words, Universal Links, deep linking). Anyway,
 * we need a hardcoded list because it has proven impossible to programmatically
 * read the information out of the app's manifests: App Store strips the
 * associated domains manifest out of the app so it's never downloaded on the
 * client and we did not spend a lot of effort to read the associated domains
 * out of the Andorid manifest.
 */
export const DEFAULT_STATE = [
    'alpha.jitsi.net',
    'beta.meet.jit.si',
    'meet.jit.si',
    '8x8.vc'
];

const STORE_NAME = 'features/base/known-domains';

PersistenceRegistry.register(STORE_NAME);

ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case ADD_KNOWN_DOMAINS:
        return _addKnownDomains(state, action.knownDomains);

    case APP_WILL_MOUNT:
        // In case persistence has deserialized a weird redux state:
        return _addKnownDomains(state, DEFAULT_STATE);

    default:
        return state;
    }
});

/**
 * Adds an array of known domains to the list of domains known to the feature
 * base/known-domains.
 *
 * @param {Object} state - The redux state.
 * @param {Array<string>} knownDomains - The array of known domains to add to
 * the list of domains known to the feature base/known-domains.
 * @private
 * @returns {Object} The next redux state.
 */
function _addKnownDomains(state, knownDomains) {
    // In case persistence has deserialized a weird redux state:
    let nextState = Array.isArray(state) ? state : [];

    if (Array.isArray(knownDomains)) {
        nextState = Array.from(state);
        for (let knownDomain of knownDomains) {
            knownDomain = knownDomain.toLowerCase();
            !nextState.includes(knownDomain) && nextState.push(knownDomain);
        }
    }

    return nextState;
}
