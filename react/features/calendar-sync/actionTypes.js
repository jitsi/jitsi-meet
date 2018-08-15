// @flow

/**
 * Resets the state of calendar integration so stored events and selected
 * calendar type are cleared.
 *
 * {
 *     type: CLEAR_CALENDAR_INTEGRATION
 * }
 */
export const CLEAR_CALENDAR_INTEGRATION = Symbol('CLEAR_CALENDAR_INTEGRATION');

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

/**
 * Action to update calendar type to be used for web.
 *
 * {
 *     type: SET_CALENDAR_INTEGRATION,
 *     integrationReady: boolean,
 *     integrationType: string
 * }
 */
export const SET_CALENDAR_INTEGRATION = Symbol('SET_CALENDAR_INTEGRATION');

/**
 * The type of Redux action which changes Calendar API auth state.
 *
 * {
 *     type: SET_CALENDAR_AUTH_STATE
 * }
 * @public
 */
export const SET_CALENDAR_AUTH_STATE = Symbol('SET_CALENDAR_AUTH_STATE');

/**
 * The type of Redux action which changes Calendar Profile email state.
 *
 * {
 *     type: SET_CALENDAR_PROFILE_EMAIL,
 *     email: string
 * }
 * @public
 */
export const SET_CALENDAR_PROFILE_EMAIL = Symbol('SET_CALENDAR_PROFILE_EMAIL');
