// @flow

import { ADD_KNOWN_DOMAINS } from './actionTypes';

/**
 * Creates a (redux) action to add known domains to the list of domains known to
 * the feature base/known-domains.
 *
 * @param {string | Array<string>} knownDomains - The known domain(s) to add to
 * the list of domains known to the feature base/known-domains.
 * @returns {{
 *     type: ADD_KNOWN_DOMAINS,
 *     knownDomains: Array<string>
 * }}
 */
export function addKnownDomains(knownDomains: string | Array<string>) {
    return {
        type: ADD_KNOWN_DOMAINS,
        knownDomains:
            typeof knownDomains === 'string' ? [ knownDomains ] : knownDomains
    };
}
