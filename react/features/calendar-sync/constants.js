// @flow

import { _isCalendarEnabled } from './functions';

/**
 * The indicator which determines whether the calendar feature is enabled by the
 * app.
 *
 * @type {boolean}
 */
export const CALENDAR_ENABLED = _isCalendarEnabled();

/**
 * The number of days to fetch.
 */
export const FETCH_END_DAYS = 10;

/**
 * The number of days to go back when fetching.
 */
export const FETCH_START_DAYS = -1;

/**
 * The max number of events to fetch from the calendar.
 */
export const MAX_LIST_LENGTH = 10;

/**
 * The set of calendar types.
 *
 * @enum {string}
 */
export const CALENDAR_TYPE = {
    GOOGLE: 'google',
    MICROSOFT: 'microsoft'
};

/**
 * An enumeration of the different states the Calendar API can be in.
 *
 * @private
 * @type {Object}
 */
export const CALENDAR_API_STATES = {
    /**
     * The state in which the Calendar API still needs to be loaded.
     */
    NEEDS_LOADING: 0,

    /**
     * The state in which the Calendar API is loaded and ready for use.
     */
    LOADED: 1,

    /**
     * The state in which a user has been logged in through the Calendar API.
     */
    SIGNED_IN: 2
};

/**
 * The default state of the calendar.
 *
 * NOTE: This is defined here, to be reusable by functions.js as well (see file
 * for details).
 */
export const DEFAULT_STATE = {
    apiState: CALENDAR_API_STATES.NEEDS_LOADING,
    authorization: undefined,
    events: [],
    msAuthState: undefined
};
