import { createDeviceChangedEvent, sendAnalytics } from '../analytics';
import {
    getDeviceLabelById,
    setAudioInputDevice,
    setAudioOutputDeviceId,
    setVideoInputDevice
} from '../base/devices';
import { isIosMobileBrowser } from '../base/environment/utils';
import { browser } from '../base/lib-jitsi-meet';
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
    // Always use the new track for mobile Safari because of https://bugs.webkit.org/show_bug.cgi?id=179363#c30. The
    // old track is stopped by the browser when a new track is created for preview so it needs to be replaced even if
    // the device selection doesn't change.
    const replaceTrackAlways = isIosMobileBrowser() && browser.isVersionGreaterThan('15.3');

    return (dispatch, getState) => {
        const currentState = getDeviceSelectionDialogProps(getState());

        if ((newState.selectedVideoInputId && (newState.selectedVideoInputId !== currentState.selectedVideoInputId))
            || replaceTrackAlways) {
            dispatch(updateSettings({
                userSelectedCameraDeviceId: newState.selectedVideoInputId,
                userSelectedCameraDeviceLabel:
                    getDeviceLabelById(getState(), newState.selectedVideoInputId, 'videoInput')
            }));

            dispatch(setVideoInputDevice(newState.selectedVideoInputId));
        }

        if ((newState.selectedAudioInputId && newState.selectedAudioInputId !== currentState.selectedAudioInputId)
            || replaceTrackAlways) {
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
