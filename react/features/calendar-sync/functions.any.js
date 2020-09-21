// @flow

import md5 from 'js-md5';

import { APP_LINK_SCHEME, parseURIString } from '../base/util';

import { setCalendarEvents } from './actions';
import { MAX_LIST_LENGTH } from './constants';

const ALLDAY_EVENT_LENGTH = 23 * 60 * 60 * 1000;

/**
 * Returns true of the calendar entry is to be displayed in the app, false
 * otherwise.
 *
 * @param {Object} entry - The calendar entry.
 * @returns {boolean}
 */
function _isDisplayableCalendarEntry(entry) {
    // Entries are displayable if:
    //   - Ends in the future (future or ongoing events)
    //   - Is not an all day event and there is only one attendee (these events
    //     are usually placeholder events that don't need to be shown.)
    return entry.endDate > Date.now()
        && !((entry.allDay
                || entry.endDate - entry.startDate > ALLDAY_EVENT_LENGTH)
                    && (!entry.attendees || entry.attendees.length < 2));
}

/**
 * Updates the calendar entries in redux when new list is received. The feature
 * calendar-sync doesn't display all calendar events, it displays unique
 * title, URL, and start time tuples, and it doesn't display subsequent
 * occurrences of recurring events, and the repetitions of events coming from
 * multiple calendars.
 *
 * XXX The function's {@code this} is the redux store.
 *
 * @param {Array<CalendarEntry>} events - The new event list.
 * @private
 * @returns {void}
 */
export function _updateCalendarEntries(events: Array<Object>) {
    if (!events || !events.length) {
        return;
    }

    // eslint-disable-next-line no-invalid-this
    const { dispatch, getState } = this;
    const knownDomains = getState()['features/base/known-domains'];
    const entryMap = new Map();

    for (const event of events) {
        const entry = _parseCalendarEntry(event, knownDomains);

        if (entry && _isDisplayableCalendarEntry(entry)) {
            // As was stated above, we don't display subsequent occurrences of
            // recurring events, and the repetitions of events coming from
            // multiple calendars.
            const key = md5.hex(JSON.stringify([

                // Obviously, we want to display different conference/meetings
                // URLs. URLs are the very reason why we implemented the feature
                // calendar-sync in the first place.
                entry.url,

                // We probably want to display one and the same URL to people if
                // they have it under different titles in their Calendar.
                // Because maybe they remember the title of the meeting, not the
                // URL so they expect to see the title without realizing that
                // they have the same URL already under a different title.
                entry.title,

                // XXX Eventually, given that the URL and the title are the
                // same, what sets one event apart from another is the start
                // time of the day (note the use of toTimeString() bellow)! The
                // day itself is not important because we don't want multiple
                // occurrences of a recurring event or repetitions of an even
                // from multiple calendars.
                new Date(entry.startDate).toTimeString()
            ]));
            const existingEntry = entryMap.get(key);

            // We want only the earliest occurrence (which hasn't ended in the
            // past, that is) of a recurring event.
            if (!existingEntry || existingEntry.startDate > entry.startDate) {
                entryMap.set(key, entry);
            }
        }
    }

    dispatch(
        setCalendarEvents(
            Array.from(entryMap.values())
                .sort((a, b) => a.startDate - b.startDate)
                .slice(0, MAX_LIST_LENGTH)));
}

/**
 * Checks a string against a positive pattern and a negative pattern. Returns
 * the string if it matches the positive pattern and doesn't provide any match
 * against the negative pattern. Null otherwise.
 *
 * @param {string} str - The string to check.
 * @param {string} positivePattern - The positive pattern.
 * @param {string} negativePattern - The negative pattern.
 * @returns {string}
 */
function _checkPattern(str, positivePattern, negativePattern) {
    const positiveRegExp = new RegExp(positivePattern, 'gi');
    let positiveMatch = positiveRegExp.exec(str);

    while (positiveMatch !== null) {
        const url = positiveMatch[0];

        if (!new RegExp(negativePattern, 'gi').exec(url)) {
            return url;
        }

        positiveMatch = positiveRegExp.exec(str);
    }
}

/**
 * Updates the calendar entries in Redux when new list is received.
 *
 * @param {Object} event - An event returned from the native calendar.
 * @param {Array<string>} knownDomains - The known domain list.
 * @private
 * @returns {CalendarEntry}
 */
function _parseCalendarEntry(event, knownDomains) {
    if (event) {
        const url = _getURLFromEvent(event, knownDomains);
        const startDate = Date.parse(event.startDate);
        const endDate = Date.parse(event.endDate);

        // we want to hide all events that
        // - has no start or end date
        // - for web, if there is no url and we cannot edit the event (has
        // no calendarId)
        if (isNaN(startDate)
            || isNaN(endDate)
            || (navigator.product !== 'ReactNative'
                    && !url
                    && !event.calendarId)) {
            // Ignore the event.
        } else {
            return {
                allDay: event.allDay,
                attendees: event.attendees,
                calendarId: event.calendarId,
                endDate,
                id: event.id,
                startDate,
                title: event.title,
                url
            };
        }
    }

    return null;
}

/**
 * Retrieves a Jitsi Meet URL from an event if present.
 *
 * @param {Object} event - The event to parse.
 * @param {Array<string>} knownDomains - The known domain names.
 * @private
 * @returns {string}
 */
function _getURLFromEvent(event, knownDomains) {
    const linkTerminatorPattern = '[^\\s<>$]';
    const urlRegExp
        = `http(s)?://(${knownDomains.join('|')})/${linkTerminatorPattern}+`;
    const schemeRegExp = `${APP_LINK_SCHEME}${linkTerminatorPattern}+`;
    const excludePattern = '/static/';
    const fieldsToSearch = [
        event.title,
        event.url,
        event.location,
        event.notes,
        event.description
    ];

    for (const field of fieldsToSearch) {
        if (typeof field === 'string') {
            const match
                = _checkPattern(field, urlRegExp, excludePattern)
                || _checkPattern(field, schemeRegExp, excludePattern);

            if (match) {
                const url = parseURIString(match);

                if (url) {
                    return url.toString();
                }
            }
        }
    }

    return null;
}
