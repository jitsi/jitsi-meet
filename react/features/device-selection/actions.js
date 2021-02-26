import { createDeviceChangedEvent, sendAnalytics } from '../analytics';
import {
    getDeviceLabelById,
    setAudioInputDevice,
    setAudioOutputDeviceId,
    setVideoInputDevice
} from '../base/devices';
import { updateSettings } from '../base/settings';

import { getDeviceSelectionDialogProps } from './functions';
import logger from './logger';

/**
 * Submits the settings related to device selection.
 *
 * @param {Object} newState - The new settings.
 * @returns {Function}
 */
export function submitDeviceSelectionTab(newState) {
    return (dispatch, getState) => {
        const currentState = getDeviceSelectionDialogProps(getState());

        if (newState.selectedVideoInputId
            && newState.selectedVideoInputId
                !== currentState.selectedVideoInputId) {
            dispatch(updateSettings({
                userSelectedCameraDeviceId: newState.selectedVideoInputId,
                userSelectedCameraDeviceLabel:
                    getDeviceLabelById(getState(), newState.selectedVideoInputId, 'videoInput')
            }));

            dispatch(
                setVideoInputDevice(newState.selectedVideoInputId));
        }

        if (newState.selectedAudioInputId
                && newState.selectedAudioInputId
                  !== currentState.selectedAudioInputId) {
            dispatch(updateSettings({
                userSelectedMicDeviceId: newState.selectedAudioInputId,
                userSelectedMicDeviceLabel:
                    getDeviceLabelById(getState(), newState.selectedAudioInputId, 'audioInput')
            }));

            dispatch(
                setAudioInputDevice(newState.selectedAudioInputId));
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
