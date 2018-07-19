// @flow

import { setFollowMe, setStartMutedPolicy } from '../base/conference';
import { openDialog } from '../base/dialog';
import { i18next } from '../base/i18n';

import { SET_SETTINGS_VIEW_VISIBLE } from './actionTypes';
import { SettingsDialog } from './components';
import { getMoreTabProps, getProfileTabProps } from './functions';

declare var APP: Object;

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


/**
 * Submits the settings from the "More" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitMoreTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getMoreTabProps(getState());

        if (newState.followMeEnabled !== currentState.followMeEnabled) {
            dispatch(setFollowMe(newState.followMeEnabled));
        }

        if (newState.startAudioMuted !== currentState.startAudioMuted
            || newState.startVideoMuted !== currentState.startVideoMuted) {
            dispatch(setStartMutedPolicy(
                newState.startAudioMuted, newState.startVideoMuted));
        }

        if (newState.currentLanguage !== currentState.currentLanguage) {
            i18next.changeLanguage(newState.currentLanguage);
        }
    };
}

/**
 * Submits the settings from the "Profile" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitProfileTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getProfileTabProps(getState());

        if (newState.displayName !== currentState.displayName) {
            APP.conference.changeLocalDisplayName(newState.displayName);
        }

        if (newState.email !== currentState.email) {
            APP.conference.changeLocalEmail(newState.email);
        }
    };
}
