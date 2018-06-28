// @flow

import { NativeModules } from 'react-native';

/**
 * The indicator which determines whether the calendar feature is enabled by the
 * app.
 *
 * @type {boolean}
 */
export const CALENDAR_ENABLED = _isCalendarEnabled();

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

/**
 * Determines whether the calendar feature is enabled by the app. For
 * example, Apple through its App Store requires
 * {@code NSCalendarsUsageDescription} in the app's Info.plist or App Store
 * rejects the app.
 *
 * @returns {boolean} If the app has enabled the calendar feature, {@code true};
 * otherwise, {@code false}.
 */
function _isCalendarEnabled() {
    const { calendarEnabled } = NativeModules.AppInfo;

    return typeof calendarEnabled === 'undefined' ? true : calendarEnabled;
}
