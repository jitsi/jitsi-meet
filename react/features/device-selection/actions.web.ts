import { isEqual } from 'lodash-es';

import { createDeviceChangedEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import {
    setAudioInputDevice,
    setAudioOutputDevice,
    setVideoInputDevice
} from '../base/devices/actions';
import { getDeviceLabelById } from '../base/devices/functions';
import { updateSettings } from '../base/settings/actions';
import { toggleUpdateAudioSettings } from '../base/tracks/actions.web';
import { getLocalJitsiAudioTrack } from '../base/tracks/functions.any';
import { toggleNoiseSuppression } from '../noise-suppression/actions';
import { setScreenshareFramerate } from '../screen-share/actions.web';
import { openSettingsDialog, setAudioSettings } from '../settings/actions.web';
import { SETTINGS_TABS } from '../settings/constants';
import { disposePreviewAudioTrack } from '../settings/functions.web';

import { getAudioDeviceSelectionDialogProps, getVideoDeviceSelectionDialogProps } from './functions';
import logger from './logger';

/**
 * How long to wait for the devices that the audio test saved to be in use.
 */
const DEVICE_SWITCH_TIMEOUT = 5000;

/**
 * Opens the audio settings again once they show the devices that the audio test saved: the settings keep the devices
 * they open with, so saving them would switch back otherwise.
 *
 * @param {string} [micId] - The microphone that the test saved.
 * @param {string} [speakerId] - The speakers that the test saved.
 * @param {boolean} isDisplayedOnWelcomePage - Whether the test was opened on the welcome page.
 * @returns {Function}
 */
export function openAudioSettingsWhenApplied(micId: string | undefined, speakerId: string | undefined,
        isDisplayedOnWelcomePage: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const giveUpAt = Date.now() + DEVICE_SWITCH_TIMEOUT;
        const check = () => {
            const { selectedAudioInputId, selectedAudioOutputId }
                = getAudioDeviceSelectionDialogProps(getState(), isDisplayedOnWelcomePage);

            if ((!micId || selectedAudioInputId === micId) && (!speakerId || selectedAudioOutputId === speakerId)) {
                // Unless the user opened something else meanwhile.
                getState()['features/base/dialog'].component
                    || dispatch(openSettingsDialog(SETTINGS_TABS.AUDIO, isDisplayedOnWelcomePage));
            } else if (Date.now() < giveUpAt) {
                window.setTimeout(check, 100);
            } else {
                logger.warn('Not opening the audio settings again: the devices of the audio test are not in use yet');
            }
        };

        check();
    };
}

/**
 * Submits the settings related to audio device selection.
 *
 * @param {Object} newState - The new settings.
 * @param {boolean} isDisplayedOnWelcomePage - Indicates whether the device selection dialog is displayed on the
 * welcome page or not.
 * @returns {Function}
 */
export function submitAudioDeviceSelectionTab(newState: any, isDisplayedOnWelcomePage: boolean) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const currentState = getAudioDeviceSelectionDialogProps(getState(), isDisplayedOnWelcomePage);
        const isSelectedAudioInputIdChanged = newState.selectedAudioInputId
            && newState.selectedAudioInputId !== currentState.selectedAudioInputId;

        if (isSelectedAudioInputIdChanged) {
            dispatch(updateSettings({
                userSelectedMicDeviceId: newState.selectedAudioInputId,
                userSelectedMicDeviceLabel:
                    getDeviceLabelById(getState(), newState.selectedAudioInputId, 'audioInput')
            }));

            await disposePreviewAudioTrack(getState());

            dispatch(setAudioSettings(newState.audioSettings));
            dispatch(setAudioInputDevice(newState.selectedAudioInputId));
        }

        if (newState.selectedAudioOutputId
            && newState.selectedAudioOutputId
            !== currentState.selectedAudioOutputId) {
            sendAnalytics(createDeviceChangedEvent('audio', 'output'));

            dispatch(setAudioOutputDevice(newState.selectedAudioOutputId));
        }

        if (newState.noiseSuppressionEnabled !== currentState.noiseSuppressionEnabled) {
            dispatch(toggleNoiseSuppression());
        }

        if (!isEqual(newState.audioSettings, currentState.audioSettings) && !isSelectedAudioInputIdChanged && !newState.noiseSuppressionEnabled) {
            const state = getState();
            const jitsiTrack = getLocalJitsiAudioTrack(state);

            if (!jitsiTrack) {
                logger.debug('No local audio track found');
                dispatch(setAudioSettings(newState.audioSettings));

                return;
            }

            await disposePreviewAudioTrack(getState());
            dispatch(toggleUpdateAudioSettings(newState.audioSettings));
        }
    };
}

/**
 * Saves the devices chosen in the audio test, the same way as the audio settings.
 *
 * @param {string} [micId] - The microphone.
 * @param {string} [speakerId] - The speakers.
 * @param {boolean} isDisplayedOnWelcomePage - Whether the test was opened on the welcome page.
 * @returns {Function}
 */
export function submitAudioTestDevices(micId: string | undefined, speakerId: string | undefined,
        isDisplayedOnWelcomePage: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => dispatch(submitAudioDeviceSelectionTab({
        ...getAudioDeviceSelectionDialogProps(getState(), isDisplayedOnWelcomePage),
        selectedAudioInputId: micId,
        selectedAudioOutputId: speakerId
    }, isDisplayedOnWelcomePage));
}

/**
 * Submits the settings related to device selection.
 *
 * @param {Object} newState - The new settings.
 * @param {boolean} isDisplayedOnWelcomePage - Indicates whether the device selection dialog is displayed on the
 * welcome page or not.
 * @returns {Function}
 */
export function submitVideoDeviceSelectionTab(newState: any, isDisplayedOnWelcomePage: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const currentState = getVideoDeviceSelectionDialogProps(getState(), isDisplayedOnWelcomePage);

        if (newState.selectedVideoInputId && (newState.selectedVideoInputId !== currentState.selectedVideoInputId)) {
            dispatch(updateSettings({
                userSelectedCameraDeviceId: newState.selectedVideoInputId,
                userSelectedCameraDeviceLabel:
                    getDeviceLabelById(getState(), newState.selectedVideoInputId, 'videoInput')
            }));
            dispatch(setVideoInputDevice(newState.selectedVideoInputId));
        }
        if (newState.localFlipX !== currentState.localFlipX) {
            dispatch(updateSettings({
                localFlipX: newState.localFlipX
            }));
        }

        if (newState.currentFramerate !== currentState.currentFramerate) {
            const frameRate = parseInt(newState.currentFramerate, 10);

            dispatch(setScreenshareFramerate(frameRate));
        }
    };
}
