// @flow
import Logger from 'jitsi-meet-logger';
import RNCalendarEvents from 'react-native-calendar-events';

import { APP_WILL_MOUNT } from '../app';
import { SET_ROOM } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';
import { APP_LINK_SCHEME, parseURIString } from '../base/util';
import { APP_STATE_CHANGED } from '../mobile/background';


import {
    maybeAddNewKnownDomain,
    updateCalendarAccessStatus,
    updateCalendarEntryList
} from './actions';
import { REFRESH_CALENDAR_ENTRY_LIST } from './actionTypes';

const FETCH_END_DAYS = 10;
const FETCH_START_DAYS = -1;
const MAX_LIST_LENGTH = 10;
const logger = Logger.getLogger(__filename);

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_STATE_CHANGED:
        _maybeClearAccessStatus(store, action);
        break;
    case APP_WILL_MOUNT:
        _ensureDefaultServer(store);
        _fetchCalendarEntries(store, false, false);
        break;
    case REFRESH_CALENDAR_ENTRY_LIST:
        _fetchCalendarEntries(store, true, action.forcePermission);
        break;
    case SET_ROOM:
        _parseAndAddDomain(store);
    }

    return result;
});

/**
 * Clears the calendar access status when the app comes back from
 * the background. This is needed as some users may never quit the
 * app, but puts it into the background and we need to try to request
 * for a permission as often as possible, but not annoyingly often.
 *
 * @private
 * @param {Object} store - The redux store.
 * @param {Object} action - The Redux action.
 * @returns {void}
 */
function _maybeClearAccessStatus(store, action) {
    const { appState } = action;

    if (appState === 'background') {
        const { dispatch } = store;

        dispatch(updateCalendarAccessStatus(undefined));
    }
}

/**
 * Ensures calendar access if possible and resolves the promise if it's granted.
 *
 * @private
 * @param {boolean} promptForPermission - Flag to tell the app if it should
 * prompt for a calendar permission if it wasn't granted yet.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise}
 */
function _ensureCalendarAccess(promptForPermission, dispatch) {
    return new Promise((resolve, reject) => {
        RNCalendarEvents.authorizationStatus()
            .then(status => {
                if (status === 'authorized') {
                    resolve(true);
                } else if (promptForPermission) {
                    RNCalendarEvents.authorizeEventStore()
                        .then(result => {
                            dispatch(updateCalendarAccessStatus(result));
                            resolve(result === 'authorized');
                        })
                        .catch(error => {
                            reject(error);
                        });
                } else {
                    resolve(false);
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * Ensures presence of the default server in the known domains list.
 *
 * @private
 * @param {Object} store - The redux store.
 * @returns {Promise}
 */
function _ensureDefaultServer(store) {
    const state = store.getState();
    const defaultURL = parseURIString(
        state['features/app'].app._getDefaultURL()
    );

    store.dispatch(maybeAddNewKnownDomain(defaultURL.host));
}

/**
 * Reads the user's calendar and updates the stored entries if need be.
 *
 * @private
 * @param {Object} store - The redux store.
 * @param {boolean} maybePromptForPermission - Flag to tell the app if it should
 * prompt for a calendar permission if it wasn't granted yet.
 * @param {boolean|undefined} forcePermission - Whether to force to re-ask
 * for the permission or not.
 * @returns {void}
 */
function _fetchCalendarEntries(
        store,
        maybePromptForPermission,
        forcePermission
) {
    const { dispatch } = store;
    const state = store.getState()['features/calendar-sync'];
    const { calendarAccessStatus } = state;
    const promptForPermission
        = (maybePromptForPermission && !calendarAccessStatus)
        || forcePermission;

    _ensureCalendarAccess(promptForPermission, dispatch)
    .then(accessGranted => {
        if (accessGranted) {
            const startDate = new Date();
            const endDate = new Date();

            startDate.setDate(startDate.getDate() + FETCH_START_DAYS);
            endDate.setDate(endDate.getDate() + FETCH_END_DAYS);

            RNCalendarEvents.fetchAllEvents(
                startDate.getTime(),
                endDate.getTime(),
                []
            )
            .then(events => {
                const { knownDomains } = state;

                _updateCalendarEntries(events, knownDomains, dispatch);
            })
            .catch(error => {
                logger.error('Error fetching calendar.', error);
            });
        } else {
            logger.warn('Calendar access not granted.');
        }
    })
    .catch(reason => {
        logger.error('Error accessing calendar.', reason);
    });
}

/**
 * Retreives a jitsi URL from an event if present.
 *
 * @private
 * @param {Object} event - The event to parse.
 * @param {Array<string>} knownDomains - The known domain names.
 * @returns {string}
 *
 */
function _getURLFromEvent(event, knownDomains) {
    const linkTerminatorPattern = '[^\\s<>$]';
    /* eslint-disable max-len */
    const urlRegExp
        = new RegExp(`http(s)?://(${knownDomains.join('|')})/${linkTerminatorPattern}+`, 'gi');
    /* eslint-enable max-len */
    const schemeRegExp
        = new RegExp(`${APP_LINK_SCHEME}${linkTerminatorPattern}+`, 'gi');
    const fieldsToSearch = [
        event.title,
        event.url,
        event.location,
        event.notes,
        event.description
    ];
    let matchArray;

    for (const field of fieldsToSearch) {
        if (typeof field === 'string') {
            if (
                (matchArray
                    = urlRegExp.exec(field) || schemeRegExp.exec(field))
                        !== null
            ) {
                return matchArray[0];
            }
        }
    }

    return null;
}

/**
 * Retreives the domain name of a room upon join and stores it
 * in the known domain list, if not present yet.
 *
 * @private
 * @param {Object} store - The redux store.
 * @returns {Promise}
 */
function _parseAndAddDomain(store) {
    const { locationURL } = store.getState()['features/base/connection'];

    store.dispatch(maybeAddNewKnownDomain(locationURL.host));
}

/**
 * Updates the calendar entries in Redux when new list is received.
 *
 * @private
 * @param {Object} event - An event returned from the native calendar.
 * @param {Array<string>} knownDomains - The known domain list.
 * @returns {CalendarEntry}
 */
function _parseCalendarEntry(event, knownDomains) {
    if (event) {
        const jitsiURL = _getURLFromEvent(event, knownDomains);

        if (jitsiURL) {
            const eventStartDate = Date.parse(event.startDate);
            const eventEndDate = Date.parse(event.endDate);

            if (isNaN(eventStartDate) || isNaN(eventEndDate)) {
                logger.warn(
                    'Skipping invalid calendar event',
                    event.title,
                    event.startDate,
                    event.endDate
                );
            } else {
                return {
                    endDate: eventEndDate,
                    id: event.id,
                    startDate: eventStartDate,
                    title: event.title,
                    url: jitsiURL
                };
            }
        }
    }

    return null;
}

/**
 * Updates the calendar entries in Redux when new list is received.
 *
 * @private
 * @param {Array<CalendarEntry>} events - The new event list.
 * @param {Array<string>} knownDomains - The known domain list.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {void}
 */
function _updateCalendarEntries(events, knownDomains, dispatch) {
    if (events && events.length) {
        const eventList = [];

        for (const event of events) {
            const calendarEntry
                = _parseCalendarEntry(event, knownDomains);
            const now = Date.now();

            if (calendarEntry && calendarEntry.endDate > now) {
                eventList.push(calendarEntry);
            }
        }

        dispatch(updateCalendarEntryList(eventList.sort((a, b) =>
            a.startDate - b.startDate
        ).slice(0, MAX_LIST_LENGTH)));
    }
}
