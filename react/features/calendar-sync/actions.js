// @flow
import { NEW_CALENDAR_ENTRY_LIST, NEW_KNOWN_DOMAIN } from './actionTypes';

/**
 * Sends an action to update the current calendar list in redux.
 *
 * @param {Array<Object>} events - The new list.
 * @returns {{
 *   type: NEW_CALENDAR_ENTRY_LIST,
 *   events: Array<Object>
 * }}
 */
export function updateCalendarEntryList(events: Array<Object>) {
    return {
        type: NEW_CALENDAR_ENTRY_LIST,
        events
    };
}

/**
 * Sends an action to add a new known domain if not present yet.
 *
 * @param {string} domainName - The new domain.
 * @returns {{
 *   type: NEW_KNOWN_DOMAIN,
 *   domainName: string
 * }}
 */
export function maybeAddNewKnownDomain(domainName: string) {
    return {
        type: NEW_KNOWN_DOMAIN,
        domainName
    };
}
