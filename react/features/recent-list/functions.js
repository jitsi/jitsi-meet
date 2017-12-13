// @flow

import moment from 'moment';

import { RECENT_URL_STORAGE } from './constants';

import { i18next } from '../base/i18n';
import { parseURIString } from '../base/util';

/**
* Retreives the recent room list and generates all the data needed
* to be displayed.
*
* @returns {Promise} The {@code Promise} to be resolved when the list
* is available.
*/
export function getRecentRooms(): Promise<Array<Object>> {
    return new Promise(resolve => {
        window.localStorage._getItemAsync(RECENT_URL_STORAGE)
            .then(recentUrls => {
                if (recentUrls) {
                    const recentUrlsObj = JSON.parse(recentUrls);
                    const recentRoomDS = [];

                    for (const entry of recentUrlsObj) {
                        const location = parseURIString(entry.conference);

                        if (location && location.room && location.hostname) {
                            recentRoomDS.push({
                                baseURL:
                                    `${location.protocol}//${location.host}`,
                                conference: entry.conference,
                                dateTimeStamp: entry.date,
                                conferenceDuration: entry.conferenceDuration,
                                dateString: _getDateString(
                                    entry.date
                                ),
                                conferenceDurationString: _getLengthString(
                                    entry.conferenceDuration
                                ),
                                initials: _getInitials(location.room),
                                room: location.room,
                                serverName: location.hostname
                            });
                        }
                    }

                    resolve(recentRoomDS.reverse());
                } else {
                    resolve([]);
                }
            });
    });
}

/**
* Retreives the recent URL list as a list of objects.
*
* @returns {Array} The list of already stored recent URLs.
*/
export function getRecentUrls() {
    let recentUrls = window.localStorage.getItem(RECENT_URL_STORAGE);

    if (recentUrls) {
        recentUrls = JSON.parse(recentUrls);
    } else {
        recentUrls = [];
    }

    return recentUrls;
}

/**
* Updates the recent URL list.
*
* @param {Array} recentUrls - The new URL list.
* @returns {void}
*/
export function updaterecentUrls(recentUrls: Array<Object>) {
    window.localStorage.setItem(
        RECENT_URL_STORAGE,
        JSON.stringify(recentUrls)
    );
}

/**
* Returns a well formatted date string to be displayed in the list.
*
* @private
* @param {number} dateTimeStamp - The UTC timestamp to be converted to String.
* @returns {string}
*/
function _getDateString(dateTimeStamp: number) {
    const date = new Date(dateTimeStamp);

    if (date.toDateString() === new Date().toDateString()) {
        // the date is today, we use fromNow format

        return moment(date)
                .locale(i18next.language)
                .fromNow();
    }

    return moment(date)
            .locale(i18next.language)
            .format('lll');
}

/**
* Returns a well formatted duration string to be displayed
* as the conference length.
*
* @private
* @param {number} duration - The duration in MS.
* @returns {string}
*/
function _getLengthString(duration: number) {
    return moment.duration(duration)
            .locale(i18next.language)
            .humanize();
}

/**
* Returns the initials supposed to be used based on the room name.
*
* @private
* @param {string} room - The room name.
* @returns {string}
*/
function _getInitials(room: string) {
    return room && room.charAt(0) ? room.charAt(0).toUpperCase() : '?';
}
