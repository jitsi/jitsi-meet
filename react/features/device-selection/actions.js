import { API_ID } from '../../../modules/API/constants';
import {
    PostMessageTransportBackend,
    Transport
} from '../../../modules/transport';

import { createDeviceChangedEvent, sendAnalytics } from '../analytics';
import {
    getAudioOutputDeviceId,
    setAudioInputDevice,
    setAudioOutputDeviceId,
    setVideoInputDevice
} from '../base/devices';
import { i18next } from '../base/i18n';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { updateSettings } from '../base/settings';

import { SET_DEVICE_SELECTION_POPUP_DATA } from './actionTypes';
import { getDeviceSelectionDialogProps } from './functions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
            _processRequest.bind(undefined, dispatch, getState));
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
 * Processes device requests from external applications.
 *
 * @param {Dispatch} dispatch - The redux {@code dispatch} function.
 * @param {Function} getState - The redux function that gets/retrieves the redux
 * state.
 * @param {Object} request - The request to be processed.
 * @param {Function} responseCallback - The callback that will send the
 * response.
 * @returns {boolean}
 */
function _processRequest(dispatch, getState, request, responseCallback) { // eslint-disable-line max-len, max-params
    if (request.type === 'devices') {
        const state = getState();
        const settings = state['features/base/settings'];

        switch (request.name) {
        case 'isDeviceListAvailable':
            responseCallback(JitsiMeetJS.mediaDevices.isDeviceListAvailable());
            break;
        case 'isDeviceChangeAvailable':
            responseCallback(
                JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(
                    request.deviceType));
            break;
        case 'isMultipleAudioInputSupported':
            responseCallback(JitsiMeetJS.isMultipleAudioInputSupported());
            break;
        case 'getCurrentDevices':
            responseCallback({
                audioInput: settings.micDeviceId,
                audioOutput: getAudioOutputDeviceId(),
                videoInput: settings.cameraDeviceId
            });
            break;
        case 'getAvailableDevices':
            responseCallback(getState()['features/base/devices']);
            break;
        case 'setDevice': {
            const { device } = request;

            switch (device.kind) {
            case 'audioinput':
                dispatch(setAudioInputDevice(device.id));
                break;
            case 'audiooutput':
                setAudioOutputDeviceId(device.id, dispatch);
                break;
            case 'videoinput':
                dispatch(setVideoInputDevice(device.id));
                break;
            default:

            }

            responseCallback(true);
            break;
        }
        default:

            return false;
        }

        return true;
    }

    return false;
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
                cameraDeviceId: newState.selectedVideoInputId
            }));

            dispatch(
                setVideoInputDevice(newState.selectedVideoInputId));
        }

        if (newState.selectedAudioInputId
                && newState.selectedAudioInputId
                  !== currentState.selectedAudioInputId) {
            dispatch(updateSettings({
                micDeviceId: newState.selectedAudioInputId
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
                dispatch)
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
