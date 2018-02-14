// @flow
import {
    NEW_CALENDAR_ENTRY_LIST,
    NEW_KNOWN_DOMAIN,
    REFRESH_CALENDAR_ENTRY_LIST
} from './actionTypes';

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

/**
 * Sends an action to refresh the entry list (fetches new data).
 *
 * @returns {{
 *   type: REFRESH_CALENDAR_ENTRY_LIST
 * }}
 */
export function refreshCalendarEntryList() {
    return {
        type: REFRESH_CALENDAR_ENTRY_LIST
    };
}

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
