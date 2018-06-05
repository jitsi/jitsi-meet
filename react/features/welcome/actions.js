// @flow

import {
    SET_SIDEBAR_VISIBLE,
    SET_WELCOME_PAGE_LIST_DEFAULT_PAGE
} from './actionTypes';

/**
 * Action to update the default page index of the {@code WelcomePageLists}
 * component.
 *
 * @param {number} pageIndex - The index of the selected page.
 * @returns {{
 *     type: SET_WELCOME_PAGE_LIST_DEFAULT_PAGE,
 *     pageIndex: number
 * }}
 */
export function setWelcomePageListDefaultPage(pageIndex: number) {
    return {
        type: SET_WELCOME_PAGE_LIST_DEFAULT_PAGE,
        pageIndex
    };
}

/**
 * Sets the visibility of {@link WelcomePageSideBar}.
 *
 * @param {boolean} visible - If the {@code WelcomePageSideBar} is to be made
 * visible, {@code true}; otherwise, {@code false}.
 * @returns {{
 *     type: SET_SIDEBAR_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setSideBarVisible(visible: boolean) {
    return {
        type: SET_SIDEBAR_VISIBLE,
        visible
    };
}
