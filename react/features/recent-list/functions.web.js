import { NavigateSectionList } from '../base/react/index';

import { toDisplayableItem } from './functions.all';

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
    const section = createSection(t('recentList.joinPastMeeting'), 'all');

    // we only want the last three conferences we were in for web
    for (const item of recentList.slice(1).slice(-3)) {
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

