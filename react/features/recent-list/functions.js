// @flow

import moment from 'moment';

import { RECENT_URL_STORAGE } from './constants';

import { i18next } from '../base/i18n';
import { parseURIString } from '../base/util';

/**
 * MomentJS uses static language bundle loading, so in order to support
 * dynamic language selection in the app we need to load all bundles that we
 * support in the app.
 * FIXME: If we decide to support MomentJS in other features as well
 * we may need to move this import and the lenient matcher to the i18n feature.
 */
require('moment/locale/bg');
require('moment/locale/de');
require('moment/locale/eo');
require('moment/locale/es');
require('moment/locale/fr');
require('moment/locale/hy-am');
require('moment/locale/it');
require('moment/locale/nb');

// OC is not available. Please submit OC translation
// to the MomentJS project.

require('moment/locale/pl');
require('moment/locale/pt');
require('moment/locale/pt-br');
require('moment/locale/ru');
require('moment/locale/sk');
require('moment/locale/sl');
require('moment/locale/sv');
require('moment/locale/tr');
require('moment/locale/zh-cn');

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
                    // we init the locale on every list render, so then it
                    // changes immediately if a language change happens
                    // in the app.
                    const locale = _getSupportedLocale();

                    for (const e of JSON.parse(recentURLs)) {
                        const location = parseURIString(e.conference);

                        if (location && location.room && location.hostname) {
                            recentRoomDS.push({
                                baseURL:
                                    `${location.protocol}//${location.host}`,
                                conference: e.conference,
                                conferenceDuration: e.conferenceDuration,
                                conferenceDurationString:
                                    _getDurationString(
                                        e.conferenceDuration,
                                        locale
                                    ),
                                dateString: _getDateString(e.date, locale),
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
 * @param {string} locale - The locale to init the formatter with. Note: This
 * locale must be supported by the formatter so ensure this prerequisite
 * before invoking the function.
 * @private
 * @returns {string}
 */
function _getDateString(dateTimeStamp: number, locale: string) {
    const date = new Date(dateTimeStamp);
    const m = _getLocalizedFormatter(date, locale);

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
 * @param {string} locale - The locale to init the formatter with. Note: This
 * locale must be supported by the formatter so ensure this prerequisite
 * before invoking the function.
 * @private
 * @returns {string}
 */
function _getDurationString(duration: number, locale: string) {
    return _getLocalizedFormatter(duration, locale)
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

/**
 * Returns a localized date formatter initialized with the
 * provided date (@code Date) or duration (@code Number).
 *
 * @private
 * @param {Date | number} dateToFormat - The date or duration to format.
 * @param {string} locale - The locale to init the formatter with. Note: This
 * locale must be supported by the formatter so ensure this prerequisite
 * before invoking the function.
 * @returns {Object}
 */
function _getLocalizedFormatter(dateToFormat: Date | number, locale: string) {
    if (typeof dateToFormat === 'number') {
        return moment.duration(dateToFormat).locale(locale);
    }

    return moment(dateToFormat).locale(locale);
}

/**
 * A lenient locale matcher to match language and dialect if possible.
 *
 * @private
 * @returns {string}
 */
function _getSupportedLocale() {
    const i18nLocale = i18next.language.toLowerCase();
    const localeRegexp = new RegExp('^([a-z]{2,2})(-)*([a-z]{2,2})*$');
    const localeResult = localeRegexp.exec(i18nLocale);

    if (localeResult) {
        const currentLocaleRegexp = new RegExp(
            `^${localeResult[1]}(-)*${`(${localeResult[3]})*` || ''}`
        );

        return moment.locales().find(
            lang => currentLocaleRegexp.exec(lang)
        ) || 'en';
    }

    // default fallback
    return 'en';
}
