// @flow
import {
    getAudioOutputDeviceId,
    getAvailableDevices,
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
        dispatch: Dispatch<*>,
        getState: Function,
        request: Object,
        responseCallback: Function) {
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
            dispatch(getAvailableDevices()).then(
                devices => responseCallback(groupDevicesByKind(devices)));

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
                responseCallback(false);
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
