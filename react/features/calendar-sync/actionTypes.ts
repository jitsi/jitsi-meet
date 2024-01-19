/**
 * Resets the state of calendar integration so stored events and selected
 * calendar type are cleared.
 *
 * {
 *     type: CLEAR_CALENDAR_INTEGRATION
 * }
 */
export const CLEAR_CALENDAR_INTEGRATION = 'CLEAR_CALENDAR_INTEGRATION';

/**
 * Action to refresh (re-fetch) the entry list.
 *
 * {
 *     type: REFRESH_CALENDAR,
 *     forcePermission: boolean,
 *     isInteractive: boolean
 * }
 */
export const REFRESH_CALENDAR = 'REFRESH_CALENDAR';

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
export const SET_CALENDAR_AUTHORIZATION = 'SET_CALENDAR_AUTHORIZATION';

/**
 * Action to update the last error that occurred while trying to authenticate
 * with or fetch data from the calendar integration.
 *
 * {
 *     type: SET_CALENDAR_ERROR,
 *     error: ?Object
 * }
 */
export const SET_CALENDAR_ERROR = 'SET_CALENDAR_ERROR';

/**
 * Action to update the current calendar entry list in the store.
 *
 * {
 *     type: SET_CALENDAR_EVENTS,
 *     events: Array<Object>
 * }
 */
export const SET_CALENDAR_EVENTS = 'SET_CALENDAR_EVENTS';

/**
 * Action to update calendar type to be used for web.
 *
 * {
 *     type: SET_CALENDAR_INTEGRATION,
 *     integrationReady: boolean,
 *     integrationType: string
 * }
 */
export const SET_CALENDAR_INTEGRATION = 'SET_CALENDAR_INTEGRATION';

/**
 * The type of Redux action which changes Calendar API auth state.
 *
 * {
 *     type: SET_CALENDAR_AUTH_STATE
 * }
 * @public
 */
export const SET_CALENDAR_AUTH_STATE = 'SET_CALENDAR_AUTH_STATE';

/**
 * The type of Redux action which changes Calendar Profile email state.
 *
 * {
 *     type: SET_CALENDAR_PROFILE_EMAIL,
 *     email: string
 * }
 * @public
 */
export const SET_CALENDAR_PROFILE_EMAIL = 'SET_CALENDAR_PROFILE_EMAIL';

/**
 * The type of Redux action which denotes whether a request is in flight to get
 * updated calendar events.
 *
 * {
 *     type: SET_LOADING_CALENDAR_EVENTS,
 *     isLoadingEvents: string
 * }
 * @public
 */
export const SET_LOADING_CALENDAR_EVENTS
    = 'SET_LOADING_CALENDAR_EVENTS';
