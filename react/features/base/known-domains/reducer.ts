import PersistenceRegistry from '../redux/PersistenceRegistry';
import ReducerRegistry from '../redux/ReducerRegistry';

import { ADD_KNOWN_DOMAINS } from './actionTypes';


const STORE_NAME = 'features/base/known-domains';

PersistenceRegistry.register(STORE_NAME);

export type IKnownDomainsState = Array<string>;

ReducerRegistry.register<IKnownDomainsState>(STORE_NAME, (state: Array<string> = [], action): IKnownDomainsState => {
    switch (action.type) {
    case ADD_KNOWN_DOMAINS:
        return _addKnownDomains(state, action.knownDomains);
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
function _addKnownDomains(state: IKnownDomainsState, knownDomains: Array<string>) {
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
