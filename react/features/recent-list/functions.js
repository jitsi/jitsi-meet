// @flow

import moment from 'moment';

// MomentJS uses static language bundle loading, so in order to support dynamic
// language selection in the app we need to load all bundles that we support in
// the app.
// FIXME: If we decide to support MomentJS in other features as well we may need
// to move this import and the lenient matcher to the i18n feature.
require('moment/locale/bg');
require('moment/locale/de');
require('moment/locale/eo');
require('moment/locale/es');
require('moment/locale/fr');
require('moment/locale/hy-am');
require('moment/locale/it');
require('moment/locale/nb');

// OC is not available. Please submit OC translation to the MomentJS project.
require('moment/locale/pl');
require('moment/locale/pt');
require('moment/locale/pt-br');
require('moment/locale/ru');
require('moment/locale/sk');
require('moment/locale/sl');
require('moment/locale/sv');
require('moment/locale/tr');
require('moment/locale/zh-cn');

import { i18next } from '../base/i18n';
import { parseURIString } from '../base/util';

/**
 * Retrieves the recent room list and generates all the data needed to be
 * displayed.
 *
 * @param {Array<Object>} list - The stored recent list retrieved from redux.
 * @returns {Array}
 */
export function getRecentRooms(list: Array<Object>): Array<Object> {
    const recentRoomDS = [];

    if (list.length) {
        // We init the locale on every list render, so then it changes
        // immediately if a language change happens in the app.
        const locale = _getSupportedLocale();

        for (const e of list) {
            const uri = parseURIString(e.conference);

            if (uri && uri.room && uri.hostname) {
                const duration
                    = e.duration || /* legacy */ e.conferenceDuration || 0;

                recentRoomDS.push({
                    baseURL: `${uri.protocol}//${uri.host}`,
                    conference: e.conference,
                    dateString: _getDateString(e.date, locale),
                    dateTimeStamp: e.date,
                    duration,
                    durationString: _getDurationString(duration, locale),
                    initials: _getInitials(uri.room),
                    room: uri.room,
                    serverName: uri.hostname
                });
            }
        }
    }

    return recentRoomDS.reverse();
}

/**
 * Returns a well formatted date string to be displayed in the list.
 *
 * @param {number} dateTimeStamp - The UTC timestamp to be converted to String.
 * @param {string} locale - The locale to init the formatter with. Note: This
 * locale must be supported by the formatter so ensure this prerequisite before
 * invoking the function.
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
 * locale must be supported by the formatter so ensure this prerequisite before
 * invoking the function.
 * @private
 * @returns {string}
 */
function _getDurationString(duration: number, locale: string) {
    return _getLocalizedFormatter(duration, locale).humanize();
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
 * Returns a localized date formatter initialized with a specific {@code Date}
 * or duration ({@code number}).
 *
 * @private
 * @param {Date|number} dateOrDuration - The date or duration to format.
 * @param {string} locale - The locale to init the formatter with. Note: The
 * specified locale must be supported by the formatter so ensure the
 * prerequisite is met before invoking the function.
 * @returns {Object}
 */
function _getLocalizedFormatter(dateOrDuration: Date | number, locale: string) {
    const m
        = typeof dateOrDuration === 'number'
            ? moment.duration(dateOrDuration)
            : moment(dateOrDuration);

    return m.locale(locale);
}

/**
 * A lenient locale matcher to match language and dialect if possible.
 *
 * @private
 * @returns {string}
 */
function _getSupportedLocale() {
    const i18nLocale = i18next.language;
    let supportedLocale;

    if (i18nLocale) {
        const localeRegexp = new RegExp('^([a-z]{2,2})(-)*([a-z]{2,2})*$');
        const localeResult = localeRegexp.exec(i18nLocale.toLowerCase());

        if (localeResult) {
            const currentLocaleRegexp
                = new RegExp(
                    `^${localeResult[1]}(-)*${`(${localeResult[3]})*` || ''}`);

            supportedLocale
                = moment.locales().find(lang => currentLocaleRegexp.exec(lang));
        }
    }

    return supportedLocale || 'en';
}
