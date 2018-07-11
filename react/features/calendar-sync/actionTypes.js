// @flow

/**
 * Action to refresh (re-fetch) the entry list.
 *
 * {
 *     type: REFRESH_CALENDAR,
 *     forcePermission: boolean,
 *     isInteractive: boolean
 * }
 */
export const REFRESH_CALENDAR = Symbol('REFRESH_CALENDAR');

/**
 * Action to signal that calendar access has already been requested since the
 * app started, so no new request should be done unless the user explicitly
 * tries to refresh the calendar view.
 *
 * {
 *     type: SET_CALENDAR_AUTHORIZATION,
 *     authorization: ?string
 * }
 */
export const SET_CALENDAR_AUTHORIZATION = Symbol('SET_CALENDAR_AUTHORIZATION');

/**
 * Action to update the current calendar entry list in the store.
 *
 * {
 *     type: SET_CALENDAR_EVENTS,
 *     events: Array<Object>
 * }
 */
export const SET_CALENDAR_EVENTS = Symbol('SET_CALENDAR_EVENTS');
