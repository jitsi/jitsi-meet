// @flow
import Logger from 'jitsi-meet-logger';
import RNCalendarEvents from 'react-native-calendar-events';

import { MiddlewareRegistry } from '../base/redux';

import { APP_WILL_MOUNT } from '../app';

import { updateCalendarEntryList } from './actions';

const FETCH_END_DAYS = 10;
const FETCH_START_DAYS = -1;
const MAX_LIST_LENGTH = 10;
const logger = Logger.getLogger(__filename);

// this is to be dynamic later.
const domainList = [
    'meet.jit.si',
    'beta.meet.jit.si'
];

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        _fetchCalendarEntries(store);
    }

    return result;
});

/**
 * Ensures calendar access if possible and resolves the promise if it's granted.
 *
 * @private
 * @returns {Promise}
 */
function _ensureCalendarAccess() {
    return new Promise((resolve, reject) => {
        RNCalendarEvents.authorizationStatus()
            .then(status => {
                if (status === 'authorized') {
                    resolve();
                } else if (status === 'undetermined') {
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
 * Reads the user's calendar and updates the stored entries if need be.
 *
 * @private
 * @param {Object} store - The redux store.
 * @returns {void}
 */
function _fetchCalendarEntries(store) {
    _ensureCalendarAccess()
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
            const eventList = [];

            if (events && events.length) {
                for (const event of events) {
                    const jitsiURL = _getURLFromEvent(event);
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
 * @returns {string}
 *
 */
function _getURLFromEvent(event) {
    const urlRegExp
        = new RegExp(`http(s)?://(${domainList.join('|')})/[^\\s<>$]+`, 'gi');
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
                (matchArray = urlRegExp.exec(field)) !== null
            ) {
                return matchArray[0];
            }
        }
    }

    return null;
}
