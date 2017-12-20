// @flow

import moment from 'moment';

import { i18next } from '../base/i18n';
import { parseURIString } from '../base/util';

import { RECENT_URL_STORAGE } from './constants';

/**
 * Retreives the recent room list and generates all the data needed to be
 * displayed.
 *
 * @returns {Promise} The {@code Promise} to be resolved when the list is
 * available.
 */
export function getRecentRooms(): Promise<Array<Object>> {
    return new Promise((resolve, reject) =>
        window.localStorage._getItemAsync(RECENT_URL_STORAGE).then(
            /* onFulfilled */ recentURLs => {
                const recentRoomDS = [];

                if (recentURLs) {
                    for (const e of JSON.parse(recentURLs)) {
                        const location = parseURIString(e.conference);

                        if (location && location.room && location.hostname) {
                            recentRoomDS.push({
                                baseURL:
                                    `${location.protocol}//${location.host}`,
                                conference: e.conference,
                                conferenceDuration: e.conferenceDuration,
                                conferenceDurationString:
                                    _getDurationString(e.conferenceDuration),
                                dateString: _getDateString(e.date),
                                dateTimeStamp: e.date,
                                initials: _getInitials(location.room),
                                room: location.room,
                                serverName: location.hostname
                            });
                        }
                    }
                }

                resolve(recentRoomDS.reverse());
            },
            /* onRejected */ reject)
    );
}

/**
 * Retreives the recent URL list as a list of objects.
 *
 * @returns {Array} The list of already stored recent URLs.
 */
export function getRecentURLs() {
    const recentURLs = window.localStorage.getItem(RECENT_URL_STORAGE);

    return recentURLs ? JSON.parse(recentURLs) : [];
}

/**
 * Updates the recent URL list.
 *
 * @param {Array} recentURLs - The new URL list.
 * @returns {void}
 */
export function updateRecentURLs(recentURLs: Array<Object>) {
    window.localStorage.setItem(
        RECENT_URL_STORAGE,
        JSON.stringify(recentURLs)
    );
}

/**
 * Returns a well formatted date string to be displayed in the list.
 *
 * @param {number} dateTimeStamp - The UTC timestamp to be converted to String.
 * @private
 * @returns {string}
 */
function _getDateString(dateTimeStamp: number) {
    const date = new Date(dateTimeStamp);
    const m = moment(date).locale(i18next.language);

    if (date.toDateString() === new Date().toDateString()) {
        // The date is today, we use fromNow format.
        return m.fromNow();
    }

    return m.format('lll');
}

/**
 * Returns a well formatted duration string to be displayed as the conference
 * length.
 *
 * @param {number} duration - The duration in MS.
 * @private
 * @returns {string}
 */
function _getDurationString(duration: number) {
    return moment.duration(duration)
            .locale(i18next.language)
            .humanize();
}

/**
 * Returns the initials supposed to be used based on the room name.
 *
 * @param {string} room - The room name.
 * @private
 * @returns {string}
 */
function _getInitials(room: string) {
    return room && room.charAt(0) ? room.charAt(0).toUpperCase() : '?';
}
