import { createDeviceChangedEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import {
    setAudioInputDevice,
    setVideoInputDevice
} from '../base/devices/actions';
import { getDeviceLabelById, setAudioOutputDeviceId } from '../base/devices/functions';
import { updateSettings } from '../base/settings/actions';

import { getDeviceSelectionDialogProps } from './functions';
import logger from './logger';

/**
 * Submits the settings related to device selection.
 *
 * @param {Object} newState - The new settings.
 * @param {boolean} isDisplayedOnWelcomePage - Indicates whether the device selection dialog is displayed on the
 * welcome page or not.
 * @returns {Function}
 */
export function submitDeviceSelectionTab(newState: any, isDisplayedOnWelcomePage: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const currentState = getDeviceSelectionDialogProps(getState(), isDisplayedOnWelcomePage);

        if (newState.selectedVideoInputId && (newState.selectedVideoInputId !== currentState.selectedVideoInputId)) {
            dispatch(updateSettings({
                userSelectedCameraDeviceId: newState.selectedVideoInputId,
                userSelectedCameraDeviceLabel:
                    getDeviceLabelById(getState(), newState.selectedVideoInputId, 'videoInput')
            }));

            dispatch(setVideoInputDevice(newState.selectedVideoInputId));
        }

        if (newState.selectedAudioInputId && newState.selectedAudioInputId !== currentState.selectedAudioInputId) {
            dispatch(updateSettings({
                userSelectedMicDeviceId: newState.selectedAudioInputId,
                userSelectedMicDeviceLabel:
                    getDeviceLabelById(getState(), newState.selectedAudioInputId, 'audioInput')
            }));

            dispatch(setAudioInputDevice(newState.selectedAudioInputId));
        }

        if (newState.selectedAudioOutputId
                && newState.selectedAudioOutputId
                    !== currentState.selectedAudioOutputId) {
            sendAnalytics(createDeviceChangedEvent('audio', 'output'));

            setAudioOutputDeviceId(
                newState.selectedAudioOutputId,
                dispatch,
                true,
                getDeviceLabelById(getState(), newState.selectedAudioOutputId, 'audioOutput'))
                .then(() => logger.log('changed audio output device'))
                .catch(err => {
                    logger.warn(
                        'Failed to change audio output device.',
                        'Default or previously set audio output device will',
                        ' be used instead.',
                        err);
                });
        }
    };
}
