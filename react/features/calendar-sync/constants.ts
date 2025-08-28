/**
 * An enumeration of support calendar integration types.
 *
 * @enum {string}
 */
export const CALENDAR_TYPE = {
    GOOGLE: 'google',
    MICROSOFT: 'microsoft'
};

/**
 * An enumeration of known errors that can occur while interacting with the
 * calendar integration.
 *
 * @enum {string}
 */
export const ERRORS = {
    AUTH_FAILED: 'sign_in_failed',
    GOOGLE_APP_MISCONFIGURED: 'idpiframe_initialization_failed'
};

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
