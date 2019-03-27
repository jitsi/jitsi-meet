// @flow

import type { Dispatch } from 'redux';

import {
    addPendingDeviceRequest,
    areDeviceLabelsInitialized,
    getAudioOutputDeviceId,
    getAvailableDevices,
    getDeviceIdByLabel,
    groupDevicesByKind,
    setAudioInputDevice,
    setAudioOutputDeviceId,
    setVideoInputDevice
} from '../base/devices';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { toState } from '../base/redux';

/**
 * Returns the properties for the device selection dialog from Redux state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the device selection dialog.
 */
export function getDeviceSelectionDialogProps(stateful: Object | Function) {
    const state = toState(stateful);
    const settings = state['features/base/settings'];

    return {
        availableDevices: state['features/base/devices'],
        disableAudioInputChange:
            !JitsiMeetJS.isMultipleAudioInputSupported(),
        disableDeviceChange:
            !JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(),
        hideAudioInputPreview:
            !JitsiMeetJS.isCollectingLocalStats(),
        hideAudioOutputSelect: !JitsiMeetJS.mediaDevices
                            .isDeviceChangeAvailable('output'),
        selectedAudioInputId: settings.micDeviceId,
        selectedAudioOutputId: getAudioOutputDeviceId(),
        selectedVideoInputId: settings.cameraDeviceId
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
export function processRequest( // eslint-disable-line max-params
        dispatch: Dispatch<any>,
        getState: Function,
        request: Object,
        responseCallback: Function) {
    if (request.type === 'devices') {
        const state = getState();
        const settings = state['features/base/settings'];
        const { conference } = state['features/base/conference'];
        let result = true;

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
            dispatch(getAvailableDevices()).then(devices => {
                if (areDeviceLabelsInitialized(state)) {
                    let audioInput, audioOutput, videoInput;
                    const audioOutputDeviceId = getAudioOutputDeviceId();
                    const { cameraDeviceId, micDeviceId } = settings;

                    devices.forEach(({ deviceId, label }) => {
                        switch (deviceId) {
                        case micDeviceId:
                            audioInput = label;
                            break;
                        case audioOutputDeviceId:
                            audioOutput = label;
                            break;
                        case cameraDeviceId:
                            videoInput = label;
                            break;
                        }
                    });

                    responseCallback({
                        audioInput,
                        audioOutput,
                        videoInput
                    });
                } else {
                    // The labels are not available if the A/V permissions are
                    // not yet granted.
                    dispatch(addPendingDeviceRequest({
                        type: 'devices',
                        name: 'getCurrentDevices',
                        responseCallback
                    }));
                }
            });

            break;
        case 'getAvailableDevices':
            dispatch(getAvailableDevices()).then(devices => {
                if (areDeviceLabelsInitialized(state)) {
                    responseCallback(groupDevicesByKind(devices));
                } else {
                    // The labels are not available if the A/V permissions are
                    // not yet granted.
                    dispatch(addPendingDeviceRequest({
                        type: 'devices',
                        name: 'getAvailableDevices',
                        responseCallback
                    }));
                }
            });

            break;
        case 'setDevice': {
            const { device } = request;

            if (!conference) {
                dispatch(addPendingDeviceRequest({
                    type: 'devices',
                    name: 'setDevice',
                    device,
                    responseCallback
                }));

                return true;
            }

            const deviceId = getDeviceIdByLabel(state, device.label);

            if (deviceId) {
                switch (device.kind) {
                case 'audioinput': {
                    dispatch(setAudioInputDevice(deviceId));
                    break;
                }
                case 'audiooutput':
                    setAudioOutputDeviceId(deviceId, dispatch);
                    break;
                case 'videoinput':
                    dispatch(setVideoInputDevice(deviceId));
                    break;
                default:
                    result = false;
                }
            } else {
                result = false;
            }

            responseCallback(result);
            break;
        }
        default:

            return false;
        }

        return true;
    }

    return false;
}
