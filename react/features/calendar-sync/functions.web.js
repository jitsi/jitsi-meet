// @flow

export * from './functions.any';

import {
    CALENDAR_TYPE,
    FETCH_END_DAYS,
    FETCH_START_DAYS
} from './constants';
import { _updateCalendarEntries } from './functions';
import { GoogleCalendarApi } from './web/googleCalendar';
import { MicrosoftCalendarApi } from './web/microsoftCalendar';

const logger = require('jitsi-meet-logger').getLogger(__filename);

declare var config: Object;

/**
 * The calendar integration single instance.
 */
let calendarIntegrationInstance;

/**
 * Determines whether the calendar feature is enabled by the web.
 *
 * @returns {boolean} If the app has enabled the calendar feature, {@code true};
 * otherwise, {@code false}.
 */
export function _isCalendarEnabled() {
    return config.enableCalendarIntegration === true;
}

/* eslint-disable no-unused-vars */
/**
 * Reads the user's calendar and updates the stored entries if need be.
 *
 * @param {Object} store - The redux store.
 * @param {boolean} maybePromptForPermission - Flag to tell the app if it should
 * prompt for a calendar permission if it wasn't granted yet.
 * @param {boolean|undefined} forcePermission - Whether to force to re-ask for
 * the permission or not.
 * @private
 * @returns {void}
 */
export function _fetchCalendarEntries(
        store,
        maybePromptForPermission,
        forcePermission) {
    /* eslint-enable no-unused-vars */
    const { dispatch, getState } = store;
    const calendarType = getState()['features/calendar-sync'].calendarType;
    const api = _getCalendarIntegration(calendarType, store);

    if (!api) {
        logger.debug('No calendar type available');

        return;
    }

    api.init()
        .then(() => dispatch(
            api.getCalendarEntries(FETCH_START_DAYS, FETCH_END_DAYS)))
        .then(_updateCalendarEntries.bind(store))
        .catch(error =>
            logger.error('Error fetching calendar.', error));
}

/**
 * Returns the calendar api implementation by type.
 *
 * @param {string} calendarType - The calendar type api
 * as defined in CALENDAR_TYPE.
 * @param {Object} store - The redux store.
 * @returns {Object}
 * @private
 */
export function _getCalendarIntegration(calendarType, store) {
    if (!calendarIntegrationInstance) {
        switch (calendarType) {
        case CALENDAR_TYPE.GOOGLE:
            calendarIntegrationInstance
                = new GoogleCalendarApi(
                    config.googleApiApplicationClientID, store);
            break;
        case CALENDAR_TYPE.MICROSOFT:
            calendarIntegrationInstance
                = new MicrosoftCalendarApi(
                    config.microsoftApiApplicationClientID, store);
            break;
        }
    }

    return calendarIntegrationInstance;
}

/**
 * Updates the profile data. Requires the api to be signed in.
 *
 * @param {Object} store - The redux store.
 * @returns {void}
 * @private
 */
export function _updateProfile(store) {
    const { dispatch, getState } = store;
    const calendarType = getState()['features/calendar-sync'].calendarType;
    const api = _getCalendarIntegration(calendarType, store);

    if (!api) {
        logger.debug('No calendar type available');

        return;
    }

    dispatch(api.updateProfile());
}
