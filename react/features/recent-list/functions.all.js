import { getLocalizedDateFormatter, getLocalizedDurationFormatter }
    from '../base/i18n/index';
import { parseURIString } from '../base/util/index';

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
    // const { _defaultServerURL } = this.props;
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
    const date = new Date(itemDate);
    const dateString = date.toDateString();
    const m = getLocalizedDateFormatter(itemDate);
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    const today = new Date();
    const todayString = today.toDateString();
    const currentYear = today.getFullYear();
    const year = date.getFullYear();

    if (dateString === todayString) {
        // The date is today, we use fromNow format.
        return m.fromNow();
    } else if (dateString === yesterdayString) {
        return t('dateUtils.yesterday');
    } else if (year !== currentYear) {
        // we only want to include the year in the date if its not the current
        // year
        return m.format('ddd, MMMM DD h:mm A, gggg');
    }

    return m.format('ddd, MMMM DD h:mm A');
}
