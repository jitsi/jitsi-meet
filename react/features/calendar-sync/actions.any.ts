import {
    REFRESH_CALENDAR,
    SET_CALENDAR_AUTHORIZATION,
    SET_CALENDAR_EVENTS
} from './actionTypes';

/**
 * Sends an action to refresh the entry list (fetches new data).
 *
 * @param {boolean} forcePermission - Whether to force to re-ask for
 * the permission or not.
 * @param {boolean} isInteractive - If true this refresh was caused by
 * direct user interaction, false otherwise.
 * @returns {{
 *     type: REFRESH_CALENDAR,
 *     forcePermission: boolean,
 *     isInteractive: boolean
 * }}
 */
export function refreshCalendar(forcePermission = false, isInteractive = true) {
    return {
        type: REFRESH_CALENDAR,
        forcePermission,
        isInteractive
    };
}

/**
 * Sends an action to signal that a calendar access has been requested. For more
 * info, see {@link SET_CALENDAR_AUTHORIZATION}.
 *
 * @param {string | undefined} authorization - The result of the last calendar
 * authorization request.
 * @returns {{
 *     type: SET_CALENDAR_AUTHORIZATION,
 *     authorization: ?string
 * }}
 */
export function setCalendarAuthorization(authorization?: string) {
    return {
        type: SET_CALENDAR_AUTHORIZATION,
        authorization
    };
}

/**
 * Sends an action to update the current calendar list in redux.
 *
 * @param {Array<Object>} events - The new list.
 * @returns {{
 *     type: SET_CALENDAR_EVENTS,
 *     events: Array<Object>
 * }}
 */
export function setCalendarEvents(events: Array<Object>) {
    return {
        type: SET_CALENDAR_EVENTS,
        events
    };
}
