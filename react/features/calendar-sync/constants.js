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
 * The default state of the calendar.
 *
 * NOTE: This is defined here, to be reusable by functions.js as well (see file
 * for details).
 */
export const DEFAULT_STATE = {
    authorization: undefined,
    events: []
};
