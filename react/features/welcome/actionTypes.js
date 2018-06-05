// @flow

/**
 * The type of the (redux) action which sets the visibility of
 * {@link WelcomePageSideBar}.
 *
 * {
 *     type: SET_SIDEBAR_VISIBLE,
 *     visible: boolean
 * }
 */
export const SET_SIDEBAR_VISIBLE = Symbol('SET_SIDEBAR_VISIBLE');

/**
 * Action to update the default page index of the {@code WelcomePageLists}
 * component.
 *
 * {
 *     type: SET_WELCOME_PAGE_LIST_DEFAULT_PAGE,
 *     pageIndex: number
 * }
 */
export const SET_WELCOME_PAGE_LIST_DEFAULT_PAGE
    = Symbol('SET_WELCOME_PAGE_LIST_DEFAULT_PAGE');
