// @flow

import { SET_SIDEBAR_VISIBILITY } from './actionTypes';

/**
 * Redux action to hide or show the status bar.
 *
 * @param {boolean} visible - The new value of the visibility.
 * @returns {{
 *     type: SET_SIDEBAR_VISIBILITY,
 *     sideBarVisible: boolean
 * }}
 */
export function setSideBarVisibility(visible: boolean) {
    return {
        type: SET_SIDEBAR_VISIBILITY,
        sideBarVisible: visible
    };
}
