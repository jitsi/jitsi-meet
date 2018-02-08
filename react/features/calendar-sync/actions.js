// @flow
import { NEW_CALENDAR_ENTRY_LIST } from './actionTypes';

/**
 * Sends an action to update the current calendar list in redux.
 *
 * @param {Array<Object>} events - The new list.
 * @returns {{
 *  type: NEW_CALENDAR_ENTRY_LIST,
 *  events: Array<Object>
 * }}
 */
export function updateCalendarEntryList(events: Array<Object>) {
    return {
        type: NEW_CALENDAR_ENTRY_LIST,
        events
    };
}
