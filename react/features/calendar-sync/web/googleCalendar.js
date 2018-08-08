/* @flow */

import {
    getCalendarEntries,
    loadGoogleAPI,
    signIn,
    updateProfile
} from '../../google-api';

/**
 * Loads and interacts with the Google Calendar API.
 */
export class GoogleCalendarApi {
    _appClientID: ?string;

    /**
     * The redux {@code dispatch} function.
     */
    _dispatch: Dispatch<*>;

    /**
     * The redux function that gets/retrieves the redux state.
     */
    _getState: Function;

    /**
     * Initializes a new Google Calendar API instance.
     *
     * @param {string} appClientID - The ID for the Google client application
     * used to init the API.
     * @param {Object} store - The redux store.
     */
    constructor(appClientID: ?string, store: Object) {
        this._appClientID = appClientID;
        this._dispatch = store.dispatch;
        this._getState = store.getState;
    }

    /**
     * Initializes the google api if needed.
     *
     * @returns {function(Dispatch<*>): Promise<void>}
     */
    init(): Promise<void> {
        if (this._getState()['features/calendar-sync'].apiState !== 0) {
            return Promise.resolve();
        }

        return this._dispatch(loadGoogleAPI(this._appClientID));
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

    /**
     * Prompts the participant to sign in to the Google API Client Library.
     *
     * @returns {function(Dispatch<*>): Promise<string|never>}
     */
    signIn() {
        return signIn();
    }

    /**
     * Updates the profile data using google-api feature.
     *
     * @returns {function(Dispatch<*>): Promise<string|never>}
     */
    updateProfile() {
        return updateProfile();
    }
}
