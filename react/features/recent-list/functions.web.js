/* global interfaceConfig */

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
    const section
        = createSection(t('recentList.joinPastMeeting'), 'joinPastMeeting');

    // We only want the last three conferences we were in for web.
    for (const item of recentList.slice(-3)) {
        const displayableItem = toDisplayableItem(item, defaultServerURL, t);

        section.data.push(displayableItem);
    }
    const displayableList = [];

    if (section.data.length) {
        section.data.reverse();
        displayableList.push(section);
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
    return interfaceConfig.RECENT_LIST_ENABLED;
}
