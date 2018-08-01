import { NavigateSectionList } from '../base/react';

import { toDisplayableItem } from './functions.any';

/**
 * Transforms the history list to a displayable list
 * with sections.
 *
 * @private
 * @param {Array<Object>} recentList - The recent list form the redux store.
 * @param {Function} t - The translate function.
 * @param {string} defaultServerURL - The default server URL.
 * @returns {Array<Object>}
 */
export function toDisplayableList(recentList, t, defaultServerURL) {
    const { createSection } = NavigateSectionList;
    const todaySection = createSection(t('dateUtils.today'), 'today');
    const yesterdaySection
        = createSection(t('dateUtils.yesterday'), 'yesterday');
    const earlierSection
        = createSection(t('dateUtils.earlier'), 'earlier');
    const today = new Date();
    const todayString = today.toDateString();
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    for (const item of recentList) {
        const itemDateString = new Date(item.date).toDateString();
        const displayableItem = toDisplayableItem(item, defaultServerURL, t);

        if (itemDateString === todayString) {
            todaySection.data.push(displayableItem);
        } else if (itemDateString === yesterdayString) {
            yesterdaySection.data.push(displayableItem);
        } else {
            earlierSection.data.push(displayableItem);
        }
    }
    const displayableList = [];

    // the recent list in the redux store has the latest date in the last index
    // therefore all the sectionLists' data that was created by parsing through
    // the recent list is in reverse order and must be reversed for the most
    // item to show first
    if (todaySection.data.length) {
        todaySection.data.reverse();
        displayableList.push(todaySection);
    }
    if (yesterdaySection.data.length) {
        yesterdaySection.data.reverse();
        displayableList.push(yesterdaySection);
    }
    if (earlierSection.data.length) {
        earlierSection.data.reverse();
        displayableList.push(earlierSection);
    }

    return displayableList;
}

/**
 * Returns <tt>true</tt> if recent list is enabled and <tt>false</tt> otherwise.
 *
 * @returns {boolean} <tt>true</tt> if recent list is enabled and <tt>false</tt>
 * otherwise.
 */
export function isRecentListEnabled() {
    return true;
}
