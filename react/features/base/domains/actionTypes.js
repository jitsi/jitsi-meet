// @flow

/**
 * Action to add new domains to the list of domains known to the feature
 * base/domains.
 *
 * {
 *     type: ADD_KNOWN_DOMAINS,
 *     knownDomains: Array<string>
 * }
 */
export const ADD_KNOWN_DOMAINS = Symbol('ADD_KNOWN_DOMAINS');
