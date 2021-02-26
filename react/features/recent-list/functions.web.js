/* global interfaceConfig */

import { parseURIString, safeDecodeURIComponent } from '../base/util';


/**
 * Transforms the history list to a displayable list.
 *
 * @private
 * @param {Array<Object>} recentList - The recent list form the redux store.
 * @returns {Array<Object>}
 */
export function toDisplayableList(recentList) {
    return (
        [ ...recentList ].reverse()
            .map(item => {
                return {
                    date: item.date,
                    duration: item.duration,
                    time: [ item.date ],
                    title: safeDecodeURIComponent(parseURIString(item.conference).room),
                    url: item.conference
                };
            }));
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
