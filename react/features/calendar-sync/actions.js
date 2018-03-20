// @flow
import {
    CALENDAR_ACCESS_REQUESTED,
    NEW_CALENDAR_ENTRY_LIST,
    NEW_KNOWN_DOMAIN,
    REFRESH_CALENDAR_ENTRY_LIST
} from './actionTypes';

/**
 * Sends an action to signal that a calendar access has been requested. For
 * more info see the {@link CALENDAR_ACCESS_REQUESTED}.
 *
 * @param {string | undefined} status - The result of the last calendar
 * access request.
 * @returns {{
 *   type: CALENDAR_ACCESS_REQUESTED
 * }}
 */
export function updateCalendarAccessStatus(status: ?string) {
    return {
        status,
        type: CALENDAR_ACCESS_REQUESTED
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

/**
 * Sends an action to refresh the entry list (fetches new data).
 *
 * @param {boolean|undefined} forcePermission - Whether to force to re-ask
 * for the permission or not.
 * @returns {{
 *   type: REFRESH_CALENDAR_ENTRY_LIST,
 *   forcePermission: boolean
 * }}
 */
export function refreshCalendarEntryList(forcePermission: boolean = false) {
    return {
        forcePermission,
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
