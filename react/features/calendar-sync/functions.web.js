// @flow

import {
    clearCalendarIntegration,
    setCalendarError,
    setLoadingCalendarEvents
} from './actions';
export * from './functions.any';

import {
    CALENDAR_TYPE,
    ERRORS,
    FETCH_END_DAYS,
    FETCH_START_DAYS
} from './constants';
import { _updateCalendarEntries } from './functions';
import { googleCalendarApi } from './web/googleCalendar';
import { microsoftCalendarApi } from './web/microsoftCalendar';
import { toState } from '../base/redux';

import logger from './logger';

/**
 * Determines whether the calendar feature is enabled by the web.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {boolean} If the app has enabled the calendar feature, {@code true};
 * otherwise, {@code false}.
 */
export function isCalendarEnabled(stateful: Function | Object) {
    const {
        enableCalendarIntegration,
        googleApiApplicationClientID,
        microsoftApiApplicationClientID
    } = toState(stateful)['features/base/config'] || {};

    return Boolean(enableCalendarIntegration && (googleApiApplicationClientID || microsoftApiApplicationClientID));
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
        store: Object,
        maybePromptForPermission: boolean,
        forcePermission: ?boolean) {
    /* eslint-enable no-unused-vars */
    const { dispatch, getState } = store;

    const { integrationType } = getState()['features/calendar-sync'];
    const integration = _getCalendarIntegration(integrationType);

    if (!integration) {
        logger.debug('No calendar type available');

        return;
    }

    dispatch(setLoadingCalendarEvents(true));

    dispatch(integration.load())
        .then(() => dispatch(integration._isSignedIn()))
        .then(signedIn => {
            if (signedIn) {
                return Promise.resolve();
            }

            return Promise.reject({
                error: ERRORS.AUTH_FAILED
            });
        })
        .then(() => dispatch(integration.getCalendarEntries(
            FETCH_START_DAYS, FETCH_END_DAYS)))
        .then(events => _updateCalendarEntries.call({
            dispatch,
            getState
        }, events))
        .then(() => {
            dispatch(setCalendarError());
        }, error => {
            logger.error('Error fetching calendar.', error);

            if (error.error === ERRORS.AUTH_FAILED) {
                dispatch(clearCalendarIntegration());
            }

            dispatch(setCalendarError(error));
        })
        .then(() => dispatch(setLoadingCalendarEvents(false)));
}

/**
 * Returns the calendar API implementation by specified type.
 *
 * @param {string} calendarType - The calendar type API as defined in
 * the constant {@link CALENDAR_TYPE}.
 * @private
 * @returns {Object|undefined}
 */
export function _getCalendarIntegration(calendarType: string) {
    switch (calendarType) {
    case CALENDAR_TYPE.GOOGLE:
        return googleCalendarApi;
    case CALENDAR_TYPE.MICROSOFT:
        return microsoftCalendarApi;
    }
}
