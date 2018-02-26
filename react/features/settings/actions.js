// @flow

import { SET_SETTINGS_VIEW_VISIBLE } from './actionTypes';

/**
 * Sets the visibility of the view/UI which renders the app's settings.
 *
 * @param {boolean} visible - If the view/UI which renders the app's settings is
 * to be made visible, {@code true}; otherwise, {@code false}.
 * @returns {{
 *     type: SET_SETTINGS_VIEW_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setSettingsViewVisible(visible: boolean) {
    return {
        type: SET_SETTINGS_VIEW_VISIBLE,
        visible
    };
}
