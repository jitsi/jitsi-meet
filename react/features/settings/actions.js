// @flow

import { setFollowMe, setStartMutedPolicy } from '../base/conference';
import { openDialog } from '../base/dialog';
import { i18next } from '../base/i18n';
import { updateSettings } from '../base/settings';
import {
    GREEN_SCREEN_CHROMA_KEY_UPDATED,
    GREEN_SCREEN_CHROMA_THRESHOLD_UPDATED,
    GREEN_SCREEN_FPS_UPDATED,
    GREEN_SCREEN_INTERNAL_RESOLUTION_UPDATED,
    GREEN_SCREEN_MULTIPLIER_UPDATED,
    GREEN_SCREEN_OUTPUT_STRIDE_UPDATED,
    GREEN_SCREEN_QUANT_BYTES_UPDATED,
    GREEN_SCREEN_TYPE_UPDATED
} from '../green-screen/actionTypes';
import { setPrejoinPageVisibility } from '../prejoin/actions';

import {
    SET_AUDIO_SETTINGS_VISIBILITY,
    SET_VIDEO_SETTINGS_VISIBILITY
} from './actionTypes';
import { SettingsDialog } from './components';
import { getMoreTabProps, getProfileTabProps, getGreenScreenTabProps } from './functions';

declare var APP: Object;

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
 * Sets the visiblity of the audio settings.
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
 * Sets the visiblity of the video settings.
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

        if (newState.followMeEnabled !== currentState.followMeEnabled) {
            dispatch(setFollowMe(newState.followMeEnabled));
        }

        const showPrejoinPage = newState.showPrejoinPage;

        if (showPrejoinPage !== currentState.showPrejoinPage) {
            // The 'showPrejoin' flag starts as 'true' on every new session.
            // This prevents displaying the prejoin page when the user re-enables it.
            if (showPrejoinPage && getState()['features/prejoin']?.showPrejoin) {
                dispatch(setPrejoinPageVisibility(false));
            }
            dispatch(updateSettings({
                userSelectedSkipPrejoin: !showPrejoinPage
            }));
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
 * Submits the settings from the "Green Screen" tab of the settings dialog.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitGreenScreenTab(newState: Object): Function {
    return (dispatch, getState) => {
        const currentState = getGreenScreenTabProps(getState());

        if (newState.enabled !== currentState.enabled) {
            APP.conference.toggleGreenScreenEffect(newState.enabled);
        }

        if (newState.image !== currentState.image) {
            APP.conference.changeGreenScreen(newState.image);
        }

        if (newState.algorithmType !== currentState.algorithmType) {
            dispatch({
                type: GREEN_SCREEN_TYPE_UPDATED,
                algorithmType: newState.algorithmType
            });
        }

        if (newState.outputStride !== currentState.outputStride) {
            dispatch({
                type: GREEN_SCREEN_OUTPUT_STRIDE_UPDATED,
                outputStride: newState.outputStride
            });
        }

        if (newState.multiplier !== currentState.multiplier) {
            dispatch({
                type: GREEN_SCREEN_MULTIPLIER_UPDATED,
                multiplier: newState.multiplier
            });
        }

        if (newState.quantBytes !== currentState.quantBytes) {
            dispatch({
                type: GREEN_SCREEN_QUANT_BYTES_UPDATED,
                quantBytes: newState.quantBytes
            });
        }

        if (newState.chromaKey !== currentState.chromaKey) {
            dispatch({
                type: GREEN_SCREEN_CHROMA_KEY_UPDATED,
                chromaKey: newState.chromaKey
            });
        }

        if (newState.chromaThreshold !== currentState.chromaThreshold) {
            dispatch({
                type: GREEN_SCREEN_CHROMA_THRESHOLD_UPDATED,
                chromaThreshold: newState.chromaThreshold
            });
        }

        if (newState.fps !== currentState.fps) {
            dispatch({
                type: GREEN_SCREEN_FPS_UPDATED,
                fps: newState.fps
            });
        }

        if (newState.internalResolution !== currentState.internalResolution) {
            dispatch({
                type: GREEN_SCREEN_INTERNAL_RESOLUTION_UPDATED,
                internalResolution: newState.internalResolution
            });
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
 * Toggles the visiblity of the audio settings.
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
 * Toggles the visiblity of the video settings.
 *
 * @returns {void}
 */
export function toggleVideoSettings() {
    return (dispatch: Function, getState: Function) => {
        const value = getState()['features/settings'].videoSettingsVisible;

        dispatch(setVideoSettingsVisibility(!value));
    };
}
