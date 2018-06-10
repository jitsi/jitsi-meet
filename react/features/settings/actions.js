// @flow

import { openDialog } from '../base/dialog';

import { SET_SETTINGS_VIEW_VISIBLE } from './actionTypes';
import { SettingsDialog } from './components';

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

/**
 * Opens {@code SettingsDialog}.
 *
 * @param {string} defaultTab - The tab in {@code SettingsDialog} that should be
 * displayed initially.
 * @returns {Function}
 */
export function openSettingsDialog(defaultTab: string) {
    return openDialog(SettingsDialog, { defaultTab });
}
