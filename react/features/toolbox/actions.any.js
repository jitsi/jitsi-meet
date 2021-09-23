// @flow

import {
    SET_TOOLBOX_ALWAYS_VISIBLE,
    SET_TOOLBOX_ENABLED,
    SET_TOOLBOX_VISIBLE
} from './actionTypes';

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
