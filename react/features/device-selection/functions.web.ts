import { IStore } from '../app/types';
import { IStateful } from '../base/app/types';
import { getWebHIDFeatureConfig } from '../base/config/functions.web';
import {
    addPendingDeviceRequest,
    getAvailableDevices,
    setAudioInputDeviceAndUpdateSettings,
    setAudioOutputDevice,
    setVideoInputDeviceAndUpdateSettings
} from '../base/devices/actions.web';
import {
    areDeviceLabelsInitialized,
    getAudioOutputDeviceId,
    getDeviceIdByLabel,
    groupDevicesByKind
} from '../base/devices/functions.web';
import { isIosMobileBrowser, isMobileBrowser } from '../base/environment/utils';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { toState } from '../base/redux/functions';
import {
    getUserSelectedCameraDeviceId,
    getUserSelectedMicDeviceId,
    getUserSelectedOutputDeviceId
} from '../base/settings/functions.web';
import { isNoiseSuppressionEnabled } from '../noise-suppression/functions';
import { isPrejoinPageVisible } from '../prejoin/functions';
import { SS_DEFAULT_FRAME_RATE, SS_SUPPORTED_FRAMERATES } from '../settings/constants';
import { isDeviceHidSupported } from '../web-hid/functions';

/**
 * Returns the properties for the audio device selection dialog from Redux state.
 *
 * @param {IStateful} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @param {boolean} isDisplayedOnWelcomePage - Indicates whether the device selection dialog is displayed on the
 * welcome page or not.
 * @returns {Object} - The properties for the audio device selection dialog.
 */
export function getAudioDeviceSelectionDialogProps(stateful: IStateful, isDisplayedOnWelcomePage: boolean) {
    // On mobile Safari because of https://bugs.webkit.org/show_bug.cgi?id=179363#c30, the old track is stopped
    // by the browser when a new track is created for preview. That's why we are disabling all previews.
    const disablePreviews = isIosMobileBrowser();

    const state = toState(stateful);
    const settings = state['features/base/settings'];
    const { permissions } = state['features/base/devices'];
    const inputDeviceChangeSupported = JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('input');
    const speakerChangeSupported = JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output');
    const userSelectedMic = getUserSelectedMicDeviceId(state);
    const deviceHidSupported = isDeviceHidSupported() && getWebHIDFeatureConfig(state);
    const noiseSuppressionEnabled = isNoiseSuppressionEnabled(state);
    const hideNoiseSuppression = isPrejoinPageVisible(state) || isDisplayedOnWelcomePage;

    // When the previews are disabled we don't need multiple audio input support in order to change the mic. This is the
    // case for Safari on iOS.
    let disableAudioInputChange
        = !JitsiMeetJS.mediaDevices.isMultipleAudioInputSupported() && !(disablePreviews && inputDeviceChangeSupported);
    let selectedAudioInputId = settings.micDeviceId;
    let selectedAudioOutputId = getAudioOutputDeviceId();

    // audio input change will be a problem only when we are in a
    // conference and this is not supported, when we open device selection on
    // welcome page changing input devices will not be a problem
    // on welcome page we also show only what we have saved as user selected devices
    if (isDisplayedOnWelcomePage) {
        disableAudioInputChange = false;
        selectedAudioInputId = userSelectedMic;
        selectedAudioOutputId = getUserSelectedOutputDeviceId(state);
    }

    // we fill the device selection dialog with the devices that are currently
    // used or if none are currently used with what we have in settings(user selected)
    return {
        disableAudioInputChange,
        disableDeviceChange: !JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(),
        hasAudioPermission: permissions.audio,
        hideAudioInputPreview: disableAudioInputChange || !JitsiMeetJS.isCollectingLocalStats() || disablePreviews,
        hideAudioOutputPreview: !speakerChangeSupported || disablePreviews,
        hideAudioOutputSelect: !speakerChangeSupported,
        hideDeviceHIDContainer: !deviceHidSupported,
        hideNoiseSuppression,
        noiseSuppressionEnabled,
        selectedAudioInputId,
        selectedAudioOutputId
    };
}

/**
 * Returns the properties for the device selection dialog from Redux state.
 *
 * @param {IStateful} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @param {boolean} isDisplayedOnWelcomePage - Indicates whether the device selection dialog is displayed on the
 * welcome page or not.
 * @returns {Object} - The properties for the device selection dialog.
 */
export function getVideoDeviceSelectionDialogProps(stateful: IStateful, isDisplayedOnWelcomePage: boolean) {
    // On mobile Safari because of https://bugs.webkit.org/show_bug.cgi?id=179363#c30, the old track is stopped
    // by the browser when a new track is created for preview. That's why we are disabling all previews.
    const disablePreviews = isMobileBrowser();

    const state = toState(stateful);
    const settings = state['features/base/settings'];
    const { permissions } = state['features/base/devices'];
    const inputDeviceChangeSupported = JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('input');
    const userSelectedCamera = getUserSelectedCameraDeviceId(state);
    const { localFlipX } = state['features/base/settings'];
    const { disableLocalVideoFlip } = state['features/base/config'];
    const hideAdditionalSettings = isPrejoinPageVisible(state) || isDisplayedOnWelcomePage;
    const framerate = state['features/screen-share'].captureFrameRate ?? SS_DEFAULT_FRAME_RATE;

    let disableVideoInputSelect = !inputDeviceChangeSupported;
    let selectedVideoInputId = settings.cameraDeviceId || userSelectedCamera;

    // audio input change will be a problem only when we are in a
    // conference and this is not supported, when we open device selection on
    // welcome page changing input devices will not be a problem
    // on welcome page we also show only what we have saved as user selected devices
    if (isDisplayedOnWelcomePage) {
        disableVideoInputSelect = false;
        selectedVideoInputId = userSelectedCamera;
    }

    // we fill the device selection dialog with the devices that are currently
    // used or if none are currently used with what we have in settings(user selected)
    return {
        currentFramerate: framerate,
        desktopShareFramerates: SS_SUPPORTED_FRAMERATES,
        disableDesktopShareSettings: isMobileBrowser(),
        disableDeviceChange: !JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(),
        disableVideoInputSelect,
        disableLocalVideoFlip,
        hasVideoPermission: permissions.video,
        hideAdditionalSettings,
        hideVideoInputPreview: !inputDeviceChangeSupported || disablePreviews,
        localFlipX: Boolean(localFlipX),
        selectedVideoInputId
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
 * @returns {boolean} - True if the request has been processed and false otherwise.
 */
export function processExternalDeviceRequest( // eslint-disable-line max-params
        dispatch: IStore['dispatch'],
        getState: IStore['getState'],
        request: any,
        responseCallback: Function) {
    if (request.type !== 'devices') {
        return false;
    }
    const state = getState();
    const settings = state['features/base/settings'];
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
    case 'getCurrentDevices': // @ts-ignore
        dispatch(getAvailableDevices()).then((devices: MediaDeviceInfo[]) => {
            if (areDeviceLabelsInitialized(state)) {
                const deviceDescriptions: any = {
                    audioInput: undefined,
                    audioOutput: undefined,
                    videoInput: undefined
                };
                const currentlyUsedDeviceIds = new Set([
                    getAudioOutputDeviceId(),
                    settings.micDeviceId ?? getUserSelectedMicDeviceId(state),
                    settings.cameraDeviceId ?? getUserSelectedCameraDeviceId(state)
                ]);

                devices.forEach(device => {
                    const { deviceId, kind } = device;

                    if (currentlyUsedDeviceIds.has(deviceId)) {
                        switch (kind) {
                        case 'audioinput':
                            deviceDescriptions.audioInput = device;
                            break;
                        case 'audiooutput':
                            deviceDescriptions.audioOutput = device;
                            break;
                        case 'videoinput':
                            deviceDescriptions.videoInput = device;
                            break;
                        }
                    }
                });

                responseCallback(deviceDescriptions);
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
    case 'getAvailableDevices': // @ts-ignore
        dispatch(getAvailableDevices()).then((devices: MediaDeviceInfo[]) => {
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

        if (!areDeviceLabelsInitialized(state)) {
            dispatch(addPendingDeviceRequest({
                type: 'devices',
                name: 'setDevice',
                device,
                responseCallback
            }));

            return true;
        }

        const { label, id } = device;
        const deviceId = label
            ? getDeviceIdByLabel(state, device.label, device.kind)
            : id;

        if (deviceId) {
            switch (device.kind) {
            case 'audioinput':
                dispatch(setAudioInputDeviceAndUpdateSettings(deviceId));
                break;
            case 'audiooutput':
                dispatch(setAudioOutputDevice(deviceId));
                break;
            case 'videoinput':
                dispatch(setVideoInputDeviceAndUpdateSettings(deviceId));
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

