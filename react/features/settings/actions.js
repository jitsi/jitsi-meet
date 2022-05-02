// @flow
import { batch } from 'react-redux';


import {
    setFollowMe,
    setStartMutedPolicy,
    setStartReactionsMuted
} from '../base/conference';
import { openDialog } from '../base/dialog';
import { i18next } from '../base/i18n';
import { updateSettings } from '../base/settings';
import { setMaxStageParticipants } from '../filmstrip/actions.web';
import { setScreenshareFramerate } from '../screen-share/actions';

import {
    SET_AUDIO_SETTINGS_VISIBILITY,
    SET_VIDEO_SETTINGS_VISIBILITY
} from './actionTypes';
import { LogoutDialog, SettingsDialog } from './components';
import {
    getModeratorTabProps,
    getMoreTabProps,
    getProfileTabProps,
    getSoundsTabProps
} from './functions';

declare var APP: Object;

/**
 * Opens {@code LogoutDialog}.
 *
 * @param {Function} onLogout - The event in {@code LogoutDialog} that should be
 *  enabled on click.
 * @returns {Function}
 */
export function openLogoutDialog(onLogout: Function) {
    return openDialog(LogoutDialog, { onLogout });
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
 * Sets the visibility of the audio settings.
 *
 * @param {boolean} value - The new value.
 * @returns {Function}
 */
function setAudioSettingsVisibility(value: boolean) {
    return {
        type: SET_AUDIO_SETTINGS_VISIBILITY,
        value
    };
}

/**
 * Sets the visibility of the video settings.
 *
 * @param {boolean} value - The new value.
 * @returns {Function}
 */
function setVideoSettingsVisibility(value: boolean) {
    return {
        type: SET_VIDEO_SETTINGS_VISIBILITY,
        value
    };
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

        const showPrejoinPage = newState.showPrejoinPage;

        if (showPrejoinPage !== currentState.showPrejoinPage) {
            dispatch(updateSettings({
                userSelectedSkipPrejoin: !showPrejoinPage
            }));
        }

        const enabledNotifications = newState.enabledNotifications;

        if (enabledNotifications !== currentState.enabledNotifications) {
            dispatch(updateSettings({
                userSelectedNotifications: {
                    ...getState()['features/base/settings'].userSelectedNotifications,
                    ...enabledNotifications
                }
            }));
        }

        if (newState.currentLanguage !== currentState.currentLanguage) {
            i18next.changeLanguage(newState.currentLanguage);
        }

        if (newState.currentFramerate !== currentState.currentFramerate) {
            const frameRate = parseInt(newState.currentFramerate, 10);

            dispatch(setScreenshareFramerate(frameRate));
        }

        if (newState.hideSelfView !== currentState.hideSelfView) {
            dispatch(updateSettings({ disableSelfView: newState.hideSelfView }));
        }

        if (Number(newState.maxStageParticipants) !== currentState.maxStageParticipants) {
            dispatch(setMaxStageParticipants(Number(newState.maxStageParticipants)));
        }
    };
}

/**
 * Submits the settings from the "Moderator" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitModeratorTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getModeratorTabProps(getState());

        if (newState.followMeEnabled !== currentState.followMeEnabled) {
            dispatch(setFollowMe(newState.followMeEnabled));
        }

        if (newState.startReactionsMuted !== currentState.startReactionsMuted) {
            batch(() => {
                // updating settings we want to update and backend (notify the rest of the participants)
                dispatch(setStartReactionsMuted(newState.startReactionsMuted, true));
                dispatch(updateSettings({ soundsReactions: !newState.startReactionsMuted }));
            });
        }

        if (newState.startAudioMuted !== currentState.startAudioMuted
            || newState.startVideoMuted !== currentState.startVideoMuted) {
            dispatch(setStartMutedPolicy(
                newState.startAudioMuted, newState.startVideoMuted));
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

/**
 * Submits the settings from the "Sounds" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitSoundsTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getSoundsTabProps(getState());
        const shouldNotUpdateReactionSounds = getModeratorTabProps(getState()).startReactionsMuted;
        const shouldUpdate = (newState.soundsIncomingMessage !== currentState.soundsIncomingMessage)
            || (newState.soundsParticipantJoined !== currentState.soundsParticipantJoined)
            || (newState.soundsParticipantLeft !== currentState.soundsParticipantLeft)
            || (newState.soundsTalkWhileMuted !== currentState.soundsTalkWhileMuted)
            || (newState.soundsReactions !== currentState.soundsReactions);

        if (shouldUpdate) {
            const settingsToUpdate = {
                soundsIncomingMessage: newState.soundsIncomingMessage,
                soundsParticipantJoined: newState.soundsParticipantJoined,
                soundsParticipantLeft: newState.soundsParticipantLeft,
                soundsTalkWhileMuted: newState.soundsTalkWhileMuted,
                soundsReactions: newState.soundsReactions
            };

            if (shouldNotUpdateReactionSounds) {
                delete settingsToUpdate.soundsReactions;
            }
            dispatch(updateSettings(settingsToUpdate));
        }
    };
}

/**
 * Toggles the visibility of the audio settings.
 *
 * @returns {void}
 */
export function toggleAudioSettings() {
    return (dispatch: Function, getState: Function) => {
        const value = getState()['features/settings'].audioSettingsVisible;

        dispatch(setAudioSettingsVisibility(!value));
    };
}

/**
 * Toggles the visibility of the video settings.
 *
 * @returns {void}
 */
export function toggleVideoSettings() {
    return (dispatch: Function, getState: Function) => {
        const value = getState()['features/settings'].videoSettingsVisible;

        dispatch(setVideoSettingsVisibility(!value));
    };
}
