import {
    getLocalizedDateFormatter,
    getLocalizedDurationFormatter
} from '../base/i18n';
import { parseURIString } from '../base/util';

/**
 * Creates a displayable list item of a recent list entry.
 *
 * @private
 * @param {Object} item - The recent list entry.
 * @param {string} defaultServerURL - The default server URL.
 * @param {Function} t - The translate function.
 * @returns {Object}
 */
export function toDisplayableItem(item, defaultServerURL, t) {
    const location = parseURIString(item.conference);
    const baseURL = `${location.protocol}//${location.host}`;
    const serverName = baseURL === defaultServerURL ? null : location.host;

    return {
        colorBase: serverName,
        key: `key-${item.conference}-${item.date}`,
        lines: [
            _toDateString(item.date, t),
            _toDurationString(item.duration),
            serverName
        ],
        title: location.room,
        url: item.conference
    };
}

/**
 * Generates a duration string for the item.
 *
 * @private
 * @param {number} duration - The item's duration.
 * @returns {string}
 */
export function _toDurationString(duration) {
    if (duration) {
        return getLocalizedDurationFormatter(duration);
    }

    return null;
}

/**
 * Generates a date string for the item.
 *
 * @private
 * @param {number} itemDate - The item's timestamp.
 * @param {Function} t - The translate function.
 * @returns {string}
 */
export function _toDateString(itemDate, t) {
    const m = getLocalizedDateFormatter(itemDate);
    const date = new Date(itemDate);
    const dateInMs = date.getTime();
    const now = new Date();
    const todayInMs = (new Date()).setHours(0, 0, 0, 0);
    const yesterdayInMs = todayInMs - 86400000; // 1 day = 86400000ms

    if (dateInMs >= todayInMs) {
        return m.fromNow();
    } else if (dateInMs >= yesterdayInMs) {
        return t('dateUtils.yesterday');
    } else if (date.getFullYear() !== now.getFullYear()) {
        // We only want to include the year in the date if its not the current
        // year.
        return m.format('ddd, MMMM DD h:mm A, gggg');
    }

    return m.format('ddd, MMMM DD h:mm A');
}
