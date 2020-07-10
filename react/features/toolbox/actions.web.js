// @flow

import type { Dispatch } from 'redux';

import {
    FULL_SCREEN_CHANGED,
    SET_FULL_SCREEN
} from './actionTypes';
import {
    clearToolboxTimeout,
    setToolboxTimeout,
    setToolboxTimeoutMS,
    setToolboxVisible
} from './actions.native';

declare var interfaceConfig: Object;

export * from './actions.native';

/**
 * Docks/undocks the Toolbox.
 *
 * @param {boolean} dock - True if dock, false otherwise.
 * @returns {Function}
 */
export function dockToolbox(dock: boolean): Function {
    return (dispatch: Dispatch<any>, getState: Function) => {
        if (interfaceConfig.filmStripOnly) {
            return;
        }

        const { timeoutMS, visible } = getState()['features/toolbox'];

        if (dock) {
            // First make sure the toolbox is shown.
            visible || dispatch(showToolbox());

            dispatch(clearToolboxTimeout());
        } else if (visible) {
            dispatch(
                setToolboxTimeout(
                    () => dispatch(hideToolbox()),
                    timeoutMS));
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
        const {
            alwaysVisible,
            hovered,
            timeoutMS
        } = state['features/toolbox'];

        if (alwaysVisible) {
            return;
        }

        dispatch(clearToolboxTimeout());

        if (!force
                && (hovered
                    || state['features/invite'].calleeInfoVisible
                    || state['features/chat'].isOpen)) {
            dispatch(
                setToolboxTimeout(
                    () => dispatch(hideToolbox()),
                    timeoutMS));
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
            alwaysVisible,
            enabled,
            timeoutMS,
            visible
        } = state['features/toolbox'];

        if (enabled && !visible) {
            dispatch(setToolboxVisible(true));

            // If the Toolbox is always visible, there's no need for a timeout
            // to toggle its visibility.
            if (!alwaysVisible) {
                dispatch(
                    setToolboxTimeout(
                        () => dispatch(hideToolbox()),
                        timeout || timeoutMS));
                dispatch(setToolboxTimeoutMS(interfaceConfig.TOOLBAR_TIMEOUT));
            }
        }
    };
}
