// @flow

import { ADD_KNOWN_DOMAINS } from './actionTypes';

/**
 * Sends an action to add one or an array of known domains if not present yet.
 *
 * @param {string | Array<string>} knownDomains - The new domain as a string or
 * an array of domains.
 * @returns {{
 *     type: ADD_KNOWN_DOMAINS,
 *     knownDomains: Array<string>
 * }}
 */
export function addKnownDomains(knownDomains: string | Array<string>) {
    return {
        type: ADD_KNOWN_DOMAINS,
        knownDomains: typeof knownDomains === 'string'
            ? [ knownDomains ] : knownDomains
    };
}
