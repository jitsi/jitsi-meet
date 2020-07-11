// @flow
import { generateRoomWithoutSeparator } from '@jitsi/js-utils/random';
import type { Dispatch } from 'redux';

import { getDefaultURL } from '../app/functions';
import { openDialog } from '../base/dialog';

import { refreshCalendar } from './actions';
import {
    UpdateCalendarEventDialog
} from './components';
import { addLinkToCalendarEntry } from './functions.native';

export * from './actions.any';

/**
 * Asks confirmation from the user to add a Jitsi link to the calendar event.
 *
 * @param {string} eventId - The event id.
 * @returns {{
 *     type: OPEN_DIALOG,
 *     component: React.Component,
 *     componentProps: (Object | undefined)
 * }}
 */
export function openUpdateCalendarEventDialog(eventId: string) {
    return openDialog(UpdateCalendarEventDialog, { eventId });
}

/**
 * Updates calendar event by generating new invite URL and editing the event
 * adding some descriptive text and location.
 *
 * @param {string} eventId - The event id.
 * @returns {Function}
 */
export function updateCalendarEvent(eventId: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const defaultUrl = getDefaultURL(getState);
        const roomName = generateRoomWithoutSeparator();

        addLinkToCalendarEntry(getState(), eventId, `${defaultUrl}/${roomName}`)
        .finally(() => {
            dispatch(refreshCalendar(false, false));
        });
    };
}
