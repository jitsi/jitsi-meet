// @flow
import Logger from 'jitsi-meet-logger';
import RNCalendarEvents from 'react-native-calendar-events';

import { SET_ROOM } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';
import { APP_LINK_SCHEME, parseURIString } from '../base/util';

import { APP_WILL_MOUNT } from '../app';

import { maybeAddNewKnownDomain, updateCalendarEntryList } from './actions';
import { REFRESH_CALENDAR_ENTRY_LIST } from './actionTypes';

const FETCH_END_DAYS = 10;
const FETCH_START_DAYS = -1;
const MAX_LIST_LENGTH = 10;
const logger = Logger.getLogger(__filename);

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        _ensureDefaultServer(store);
        _fetchCalendarEntries(store, false);
        break;
    case REFRESH_CALENDAR_ENTRY_LIST:
        _fetchCalendarEntries(store, true);
        break;
    case SET_ROOM:
        _parseAndAddDomain(store);
    }

    return result;
});

/**
 * Ensures calendar access if possible and resolves the promise if it's granted.
 *
 * @private
 * @param {boolean} promptForPermission - Flag to tell the app if it should
 * prompt for a calendar permission if it wasn't granted yet.
 * @returns {Promise}
 */
function _ensureCalendarAccess(promptForPermission) {
    return new Promise((resolve, reject) => {
        RNCalendarEvents.authorizationStatus()
            .then(status => {
                if (status === 'authorized') {
                    resolve();
                } else if (promptForPermission) {
                    RNCalendarEvents.authorizeEventStore()
                        .then(result => {
                            if (result === 'authorized') {
                                resolve();
                            } else {
                                reject(result);
                            }
                        })
                        .catch(error => {
                            reject(error);
                        });
                } else {
                    reject(status);
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
 * @param {boolean} promptForPermission - Flag to tell the app if it should
 * prompt for a calendar permission if it wasn't granted yet.
 * @returns {void}
 */
function _fetchCalendarEntries(store, promptForPermission) {
    _ensureCalendarAccess(promptForPermission)
    .then(() => {
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
            const { knownDomains } = store.getState()['features/calendar-sync'];
            const eventList = [];

            if (events && events.length) {
                for (const event of events) {
                    const jitsiURL = _getURLFromEvent(event, knownDomains);
                    const now = Date.now();

                    if (jitsiURL) {
                        const eventStartDate = Date.parse(event.startDate);
                        const eventEndDate = Date.parse(event.endDate);

                        if (isNaN(eventStartDate) || isNaN(eventEndDate)) {
                            logger.warn(
                                'Skipping calendar event due to invalid dates',
                                event.title,
                                event.startDate,
                                event.endDate
                            );
                        } else if (eventEndDate > now) {
                            eventList.push({
                                endDate: eventEndDate,
                                id: event.id,
                                startDate: eventStartDate,
                                title: event.title,
                                url: jitsiURL
                            });
                        }
                    }
                }
            }

            store.dispatch(updateCalendarEntryList(eventList.sort((a, b) =>
                a.startDate - b.startDate
            ).slice(0, MAX_LIST_LENGTH)));
        })
        .catch(error => {
            logger.error('Error fetching calendar.', error);
        });
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
