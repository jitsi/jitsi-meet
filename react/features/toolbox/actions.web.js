// @flow

import type { Dispatch } from 'redux';

import { overwriteConfig } from '../base/config';
import { isMobileBrowser } from '../base/environment/utils';

import {
    CLEAR_TOOLBOX_TIMEOUT,
    FULL_SCREEN_CHANGED,
    SET_FULL_SCREEN,
    SET_OVERFLOW_DRAWER,
    SET_OVERFLOW_MENU_VISIBLE,
    SET_TOOLBAR_HOVERED,
    SET_TOOLBOX_TIMEOUT
} from './actionTypes';
import { setToolboxVisible } from './actions';
import { getToolbarTimeout } from './functions';

export * from './actions.any';

/**
 * Docks/undocks the Toolbox.
 *
 * @param {boolean} dock - True if dock, false otherwise.
 * @returns {Function}
 */
export function dockToolbox(dock: boolean): Function {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { visible } = state['features/toolbox'];
        const toolbarTimeout = getToolbarTimeout(state);

        if (dock) {
            // First make sure the toolbox is shown.
            visible || dispatch(showToolbox());

            dispatch(clearToolboxTimeout());
        } else if (visible) {
            dispatch(
                setToolboxTimeout(
                    () => dispatch(hideToolbox()),
                    toolbarTimeout));
        } else {
            dispatch(showToolbox());
        }
    };
}

/**
 * Signals that full screen mode has been entered or exited.
 *
 * @param {boolean} fullScreen - Whether or not full screen mode is currently
 * enabled.
 * @returns {{
 *     type: FULL_SCREEN_CHANGED,
 *     fullScreen: boolean
 * }}
 */
export function fullScreenChanged(fullScreen: boolean) {
    return {
        type: FULL_SCREEN_CHANGED,
        fullScreen
    };
}

/**
 * Hides the toolbox.
 *
 * @param {boolean} force - True to force the hiding of the toolbox without
 * caring about the extended toolbar side panels.
 * @returns {Function}
 */
export function hideToolbox(force: boolean = false): Function {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { toolbarConfig: { alwaysVisible, autoHideWhileChatIsOpen } } = state['features/base/config'];
        const { hovered } = state['features/toolbox'];
        const toolbarTimeout = getToolbarTimeout(state);

        if (alwaysVisible) {
            return;
        }

        dispatch(clearToolboxTimeout());

        const focusSelector = '.toolbox-content-items:focus-within,.filmstrip:focus-within,.remotevideomenu:hover';

        if (!force
                && (hovered
                    || state['features/invite'].calleeInfoVisible
                    || (state['features/chat'].isOpen && !autoHideWhileChatIsOpen)
                    || document.querySelector(focusSelector))) {
            dispatch(
                setToolboxTimeout(
                    () => dispatch(hideToolbox()),
                    toolbarTimeout));
        } else {
            dispatch(setToolboxVisible(false));
        }
    };
}

/**
 * Signals a request to enter or exit full screen mode.
 *
 * @param {boolean} fullScreen - True to enter full screen mode, false to exit.
 * @returns {{
 *     type: SET_FULL_SCREEN,
 *     fullScreen: boolean
 * }}
 */
export function setFullScreen(fullScreen: boolean) {
    return {
        type: SET_FULL_SCREEN,
        fullScreen
    };
}

/**
 * Shows the toolbox for specified timeout.
 *
 * @param {number} timeout - Timeout for showing the toolbox.
 * @returns {Function}
 */
export function showToolbox(timeout: number = 0): Object {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const {
            toolbarConfig: { initialTimeout, alwaysVisible },
            toolbarConfig
        } = state['features/base/config'];
        const toolbarTimeout = getToolbarTimeout(state);

        const {
            enabled,
            visible
        } = state['features/toolbox'];

        if (enabled && !visible) {
            dispatch(setToolboxVisible(true));

            // If the Toolbox is always visible, there's no need for a timeout
            // to toggle its visibility.
            if (!alwaysVisible) {
                if (typeof initialTimeout === 'number') {
                    // reset `initialTimeout` once it is consumed once
                    dispatch(overwriteConfig({ toolbarConfig: {
                        ...toolbarConfig,
                        initialTimeout: null
                    } }));
                }
                dispatch(
                    setToolboxTimeout(
                        () => dispatch(hideToolbox()),
                        timeout || initialTimeout || toolbarTimeout));
            }
        }
    };
}

/**
 * Signals a request to display overflow as drawer.
 *
 * @param {boolean} displayAsDrawer - True to display overflow as drawer, false to preserve original behaviour.
 * @returns {{
 *     type: SET_OVERFLOW_DRAWER,
 *     displayAsDrawer: boolean
 * }}
 */
export function setOverflowDrawer(displayAsDrawer: boolean) {
    return {
        type: SET_OVERFLOW_DRAWER,
        displayAsDrawer
    };
}

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
 * Dispatches an action which sets new timeout for the toolbox visibility and clears the previous one.
 * On mobile browsers the toolbox does not hide on timeout. It is toggled on simple tap.
 *
 * @param {Function} handler - Function to be invoked after the timeout.
 * @param {number} timeoutMS - Delay.
 * @returns {{
 *     type: SET_TOOLBOX_TIMEOUT,
 *     handler: Function,
 *     timeoutMS: number
 * }}
 */
export function setToolboxTimeout(handler: Function, timeoutMS: number): Object {
    return function(dispatch) {
        if (isMobileBrowser()) {
            return;
        }

        dispatch({
            type: SET_TOOLBOX_TIMEOUT,
            handler,
            timeoutMS
        });
    };
}
