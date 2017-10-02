/* globals APP, interfaceConfig */

import { openDialog } from '../base/dialog';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { API_ID } from '../../../modules/API/constants';
import {
    setAudioInputDevice,
    setAudioOutputDevice,
    setVideoInputDevice
} from '../base/devices';
import { i18next } from '../base/i18n';
import {
    PostMessageTransportBackend,
    Transport
} from '../../../modules/transport';

import { SET_DEVICE_SELECTION_POPUP_DATA } from './actionTypes';
import { DeviceSelectionDialog } from './components';

/**
 * Open DeviceSelectionDialog with a configuration based on the environment's
 * supported abilities.
 *
 * @returns {Function}
 */
export function openDeviceSelectionDialog() {
    return dispatch => {
        if (interfaceConfig.filmStripOnly) {
            dispatch(_openDeviceSelectionDialogInPopup());
        } else {
            dispatch(_openDeviceSelectionDialogHere());
        }
    };
}

/**
 * Opens the DeviceSelectionDialog in the same window.
 *
 * @returns {Function}
 */
function _openDeviceSelectionDialogHere() {
    return dispatch =>
        JitsiMeetJS.mediaDevices.isDeviceListAvailable()
            .then(isDeviceListAvailable => {
                dispatch(openDialog(DeviceSelectionDialog, {
                    currentAudioInputId: APP.settings.getMicDeviceId(),
                    currentAudioOutputId: APP.settings.getAudioOutputDeviceId(),
                    currentVideoInputId: APP.settings.getCameraDeviceId(),
                    disableAudioInputChange:
                        !JitsiMeetJS.isMultipleAudioInputSupported(),
                    disableDeviceChange: !isDeviceListAvailable
                        || !JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(),
                    hasAudioPermission: JitsiMeetJS.mediaDevices
                        .isDevicePermissionGranted.bind(null, 'audio'),
                    hasVideoPermission: JitsiMeetJS.mediaDevices
                        .isDevicePermissionGranted.bind(null, 'video'),
                    hideAudioInputPreview:
                        !JitsiMeetJS.isCollectingLocalStats(),
                    hideAudioOutputSelect: !JitsiMeetJS.mediaDevices
                        .isDeviceChangeAvailable('output')
                }));
            });
}

/**
 * Opens a popup window with the device selection dialog in it.
 *
 * @returns {Function}
 */
function _openDeviceSelectionDialogInPopup() {
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
 */ // eslint-disable-next-line max-params
function _processRequest(dispatch, getState, request, responseCallback) {
    if (request.type === 'devices') {
        switch (request.name) {
        case 'isDeviceListAvailable':
            JitsiMeetJS.mediaDevices.isDeviceListAvailable()
                .then(isDeviceListAvailable =>
                    responseCallback(isDeviceListAvailable))
                .catch(e => responseCallback(null, e));
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
                audioInput: APP.settings.getMicDeviceId(),
                audioOutput: APP.settings.getAudioOutputDeviceId(),
                videoInput: APP.settings.getCameraDeviceId()
            });
            break;
        case 'getAvailableDevices':
            responseCallback(getState()['features/base/devices']);
            break;
        case 'setDevice': {
            let action;
            const { device } = request;

            switch (device.kind) {
            case 'audioinput':
                action = setAudioInputDevice;
                break;
            case 'audiooutput':
                action = setAudioOutputDevice;
                break;
            case 'videoinput':
                action = setVideoInputDevice;
                break;
            default:

            }
            dispatch(action(device.id));
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
