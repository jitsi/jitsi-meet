/* @flow */

import { getCalendarEntries, loadGoogleAPI } from '../../google-api';

/**
 * Loads and interacts with the Google Calendar API.
 */
export class GoogleCalendarApi {
    _appClientID: ?string;

    /**
     * Initializes a new Google Calendar API instance.
     *
     * @param {string} appClientID - The ID for the Google client application
     * used to init the API.
     */
    constructor(appClientID: ?string) {
        this._appClientID = appClientID;
    }

    /**
     * Initializes the google api if needed.
     *
     * @param {Dispatch} dispatch - The redux {@code dispatch} function.
     * @param {Function} getState - The redux function that gets/retrieves the
     * redux state.
     * @returns {function(Dispatch<*>): Promise<void>}
     */
    init(dispatch: Function, getState: Function): Promise<void> {
        if (getState()['features/calendar-sync'].apiState !== 0) {
            return Promise.resolve();
        }

        return dispatch(loadGoogleAPI(this._appClientID));
    }

    /**
     * Retrieves the current calendar events.
     *
     * @param {number} fetchStartDays - The number of days to go back
     * when fetching.
     * @param {number} fetchEndDays - The number of days to fetch.
     * @returns {function(Dispatch<*>): Promise<CalendarEntries>}
     */
    getCalendarEntries(fetchStartDays: ?number, fetchEndDays: ?number) {
        return getCalendarEntries(fetchStartDays, fetchEndDays);
    }
}
