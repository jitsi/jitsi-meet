/* @flow */

import {
    getCalendarEntries,
    googleApi,
    loadGoogleAPI,
    signIn,
    signOut,
    updateProfile
} from '../../google-api';
import { CALENDAR_TYPE } from '../constants';

declare var config: Object;

/**
 * A stateless object that implements the expected interface for interacting
 * Google authentication in order to get calendar data.
 *
 * @type {Object}
 */
export const googleCalendarApi = {
    /**
     * Retrieves the current calendar events.
     *
     * @param {number} fetchStartDays - The number of days to go back
     * when fetching.
     * @param {number} fetchEndDays - The number of days to fetch.
     * @returns {function(Dispatch<*>): Promise<CalendarEntries>}
     */
    getCalendarEntries,

    /**
     * Returns the type of calendar integration this object implements.
     *
     * @returns {string}
     */
    getType() {
        return CALENDAR_TYPE.GOOGLE;
    },

    /**
     * Initializes the google api if needed.
     *
     * @returns {function(Dispatch<*>): Promise<void>}
     */
    load() {
        return (dispatch: Dispatch<*>) => dispatch(
            loadGoogleAPI(config.googleApiApplicationClientID));
    },

    /**
     * Prompts the participant to sign in to the Google API Client Library.
     *
     * @returns {function(Dispatch<*>): Promise<string|never>}
     */
    signIn,

    /**
     * Sign out from the Google API Client Library.
     *
     * @returns {function(Dispatch<*>): Promise<string|never>}
     */
    signOut,

    /**
     * Updates the profile data using google-api feature.
     *
     * @returns {function(Dispatch<*>): Promise<string|never>}
     */
    updateProfile,

    /**
     * Returns whether or not the user is currently signed in.
     *
     * @returns {function(): Promise<boolean>}
     */
    _isSignedIn() {
        return () => googleApi.isSignedIn();
    }
};
