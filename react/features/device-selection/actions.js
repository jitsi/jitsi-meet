import { API_ID } from '../../../modules/API/constants';
import {
    PostMessageTransportBackend,
    Transport
} from '../../../modules/transport';

import { createDeviceChangedEvent, sendAnalytics } from '../analytics';
import {
    getDeviceLabelById,
    setAudioInputDevice,
    setAudioOutputDeviceId,
    setVideoInputDevice
} from '../base/devices';
import { i18next } from '../base/i18n';
import { updateSettings } from '../base/settings';

import { SET_DEVICE_SELECTION_POPUP_DATA } from './actionTypes';
import { getDeviceSelectionDialogProps, processExternalDeviceRequest } from './functions';
import logger from './logger';

/**
 * Opens a popup window with the device selection dialog in it.
 *
 * @returns {Function}
 */
export function openDeviceSelectionPopup() {
    return (dispatch, getState) => {
        const { popupDialogData } = getState()['features/device-selection'];

        if (popupDialogData) {
            popupDialogData.popup.focus();

            return;
        }

        // API_ID will always be defined because the iframe api is enabled
        const scope = `dialog_${API_ID}`;
        const url = `${
            window.location.origin}/static/deviceSelectionPopup.html#scope=${
            encodeURIComponent(JSON.stringify(scope))}`;
        const popup
            = window.open(
                url,
                'device-selection-popup',
                'toolbar=no,scrollbars=no,resizable=no,width=720,height=458');

        popup.addEventListener('DOMContentLoaded', () => {
            popup.init(i18next);
        });

        const transport = new Transport({
            backend: new PostMessageTransportBackend({
                postisOptions: {
                    scope,
                    window: popup
                }
            })
        });

        transport.on('request',
            processExternalDeviceRequest.bind(undefined, dispatch, getState));
        transport.on('event', event => {
            if (event.type === 'devices-dialog' && event.name === 'close') {
                popup.close();
                transport.dispose();
                dispatch(_setDeviceSelectionPopupData());

                return true;
            }

            return false;
        });

        dispatch(_setDeviceSelectionPopupData({
            popup,
            transport
        }));
    };
}

/**
 * Sets information about device selection popup in the store.
 *
 * @param {Object} popupDialogData - Information about the popup.
 * @param {Object} popupDialog.popup - The popup object returned from
 * window.open.
 * @param {Object} popupDialogData.transport - The transport instance used for
 * communication with the popup window.
 * @returns {{
 *     type: SET_DEVICE_SELECTION_POPUP_DATA,
 *     popupDialogData: Object
 * }}
 */
function _setDeviceSelectionPopupData(popupDialogData) {
    return {
        type: SET_DEVICE_SELECTION_POPUP_DATA,
        popupDialogData
    };
}

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
