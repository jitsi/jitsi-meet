// @flow

import {
    REFRESH_CALENDAR,
    SET_CALENDAR_AUTH_STATE,
    SET_CALENDAR_AUTHORIZATION,
    SET_CALENDAR_API_STATE,
    SET_CALENDAR_EVENTS,
    SET_CALENDAR_PROFILE_EMAIL,
    SET_CALENDAR_TYPE
} from './actionTypes';
import { _getCalendarIntegration } from './functions';

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
export function refreshCalendar(
        forcePermission: boolean = false, isInteractive: boolean = true) {
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
export function setCalendarAuthorization(authorization: ?string) {
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

/**
 * Sets the calendar type to be used by web.
 *
 * @param {string|undefined} calendarType - The calendar type.
 * @returns {{
 *     type: SET_CALENDAR_TYPE,
 *     calendarType: ?string
 * }}
 */
export function setCalendarType(calendarType: ?string) {
    return {
        type: SET_CALENDAR_TYPE,
        calendarType
    };
}

/**
 * Sends an action to update the current calendar api state in redux.
 *
 * @param {number} newState - The new state.
 * @returns {{
 *     type: SET_CALENDAR_API_STATE,
 *     apiState: number
 * }}
 */
export function setCalendarAPIState(newState: ?number) {
    return {
        type: SET_CALENDAR_API_STATE,
        apiState: newState
    };
}

/**
 * Prompts the participant to sign in.
 *
 * @returns {function(Dispatch<*>, Function): Promise<string | never>}
 */
export function signIn() {
    return (dispatch: Dispatch<*>, getState: Function): Promise<*> => {
        const { calendarType } = getState()['features/calendar-sync'];
        const api = _getCalendarIntegration(
            calendarType, {
                dispatch,
                getState
            });

        if (!api) {
            return Promise.reject('No calendar type selected!');
        }

        return dispatch(api.signIn());
    };
}

/**
 * Sends an action to update the current calendar api auth state in redux.
 *
 * @param {number} newState - The new state.
 * @returns {{
 *     type: SET_CALENDAR_AUTH_STATE,
 *     msAuthState: Object
 * }}
 */
export function setCalendarAPIAuthState(newState: ?Object) {
    return {
        type: SET_CALENDAR_AUTH_STATE,
        msAuthState: newState
    };
}

/**
 * Sends an action to update the current calendar profile email state in redux.
 *
 * @param {number} newEmail - The new email.
 * @returns {{
 *     type: SET_CALENDAR_AUTH_STATE,
 *     email: Object
 * }}
 */
export function setCalendarProfileEmail(newEmail: string) {
    return {
        type: SET_CALENDAR_PROFILE_EMAIL,
        email: newEmail
    };
}
