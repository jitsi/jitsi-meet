/* @flow */

import {
    CLEAR_TOOLBOX_TIMEOUT,
    SET_OVERFLOW_MENU_VISIBLE,
    SET_TOOLBAR_HOVERED,
    SET_TOOLBOX_ALWAYS_VISIBLE,
    SET_TOOLBOX_ENABLED,
    SET_TOOLBOX_TIMEOUT,
    SET_TOOLBOX_TIMEOUT_MS,
    SET_TOOLBOX_VISIBLE,
    TOGGLE_TOOLBOX_VISIBLE
} from './actionTypes';


/**
 * Signals that toolbox timeout should be cleared.
 *
 * @returns {{
 *     type: CLEAR_TOOLBOX_TIMEOUT
 * }}
 */
export function clearToolboxTimeout(): Object {
    return {
        type: CLEAR_TOOLBOX_TIMEOUT
    };
}

/**
 * Shows/hides the overflow menu.
 *
 * @param {boolean} visible - True to show it or false to hide it.
 * @returns {{
 *     type: SET_OVERFLOW_MENU_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setOverflowMenuVisible(visible: boolean): Object {
    return {
        type: SET_OVERFLOW_MENU_VISIBLE,
        visible
    };
}

/**
 * Signals that toolbar is hovered value should be changed.
 *
 * @param {boolean} hovered - Flag showing whether toolbar is hovered.
 * @returns {{
 *     type: SET_TOOLBAR_HOVERED,
 *     hovered: boolean
 * }}
 */
export function setToolbarHovered(hovered: boolean): Object {
    return {
        type: SET_TOOLBAR_HOVERED,
        hovered
    };
}

/**
 * Signals that always visible toolbars value should be changed.
 *
 * @param {boolean} alwaysVisible - Value to be set in redux store.
 * @returns {{
 *     type: SET_TOOLBOX_ALWAYS_VISIBLE,
 *     alwaysVisible: boolean
 * }}
 */
export function setToolboxAlwaysVisible(alwaysVisible: boolean): Object {
    return {
        type: SET_TOOLBOX_ALWAYS_VISIBLE,
        alwaysVisible
    };
}

/* eslint-disable flowtype/space-before-type-colon */

/**
 * Enables/disables the toolbox.
 *
 * @param {boolean} enabled - True to enable the toolbox or false to disable it.
 * @returns {{
 *     type: SET_TOOLBOX_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setToolboxEnabled(enabled: boolean): Object {
    return {
        type: SET_TOOLBOX_ENABLED,
        enabled
    };
}

/**
 * Dispatches an action which sets new timeout and clears the previous one.
 *
 * @param {Function} handler - Function to be invoked after the timeout.
 * @param {number} timeoutMS - Delay.
 * @returns {{
 *     type: SET_TOOLBOX_TIMEOUT,
 *     handler: Function,
 *     timeoutMS: number
 * }}
 */
export function setToolboxTimeout(handler: Function, timeoutMS: number)
      : Object {
    return {
        type: SET_TOOLBOX_TIMEOUT,
        handler,
        timeoutMS
    };
}

/* eslint-enable flowtype/space-before-type-colon */

/**
 * Dispatches an action which sets new toolbox timeout value.
 *
 * @param {number} timeoutMS - Delay.
 * @returns {{
 *     type: SET_TOOLBOX_TIMEOUT_MS,
 *     timeoutMS: number
 * }}
 */
export function setToolboxTimeoutMS(timeoutMS: number): Object {
    return {
        type: SET_TOOLBOX_TIMEOUT_MS,
        timeoutMS
    };
}

/**
 * Shows/hides the toolbox.
 *
 * @param {boolean} visible - True to show the toolbox or false to hide it.
 * @returns {{
 *     type: SET_TOOLBOX_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setToolboxVisible(visible: boolean): Object {
    return {
        type: SET_TOOLBOX_VISIBLE,
        visible
    };
}

/**
 * Action to toggle the toolbox visibility.
 *
 * @returns {{
 *     type: TOGGLE_TOOLBOX_VISIBLE
 * }}
 */
export function toggleToolboxVisible() {
    return {
        type: TOGGLE_TOOLBOX_VISIBLE
    };
}
