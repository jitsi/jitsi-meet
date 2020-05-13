/* global APP */

import { CONFERENCE_JOINED } from '../conference';
import { processExternalDeviceRequest } from '../../device-selection';
import { MiddlewareRegistry } from '../redux';
import UIEvents from '../../../../service/UI/UIEvents';
import { JitsiTrackErrors } from '../lib-jitsi-meet';

import {
    removePendingDeviceRequests,
    setAudioInputDevice,
    setVideoInputDevice
} from './actions';
import {
    CHECK_AND_NOTIFY_FOR_NEW_DEVICE,
    NOTIFY_CAMERA_ERROR,
    NOTIFY_MIC_ERROR,
    SET_AUDIO_INPUT_DEVICE,
    SET_VIDEO_INPUT_DEVICE
} from './actionTypes';
import { replaceAudioTrackById, replaceVideoTrackById, setDeviceStatusWarning } from '../../prejoin/actions';
import { isPrejoinPageVisible } from '../../prejoin/functions';
import { showNotification, showWarningNotification } from '../../notifications';
import { updateSettings } from '../settings';
import { formatDeviceLabel, setAudioOutputDeviceId } from './functions';
import logger from './logger';

const JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP = {
    microphone: {
        [JitsiTrackErrors.CONSTRAINT_FAILED]: 'dialog.micConstraintFailedError',
        [JitsiTrackErrors.GENERAL]: 'dialog.micUnknownError',
        [JitsiTrackErrors.NOT_FOUND]: 'dialog.micNotFoundError',
        [JitsiTrackErrors.PERMISSION_DENIED]: 'dialog.micPermissionDeniedError'
    },
    camera: {
        [JitsiTrackErrors.CONSTRAINT_FAILED]: 'dialog.cameraConstraintFailedError',
        [JitsiTrackErrors.GENERAL]: 'dialog.cameraUnknownError',
        [JitsiTrackErrors.NOT_FOUND]: 'dialog.cameraNotFoundError',
        [JitsiTrackErrors.PERMISSION_DENIED]: 'dialog.cameraPermissionDeniedError',
        [JitsiTrackErrors.UNSUPPORTED_RESOLUTION]: 'dialog.cameraUnsupportedResolutionError'
    }
};

/**
 * Implements the middleware of the feature base/devices.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);
    case NOTIFY_CAMERA_ERROR: {
        if (typeof APP !== 'object' || !action.error) {
            break;
        }

        const { message, name } = action.error;

        const cameraJitsiTrackErrorMsg
            = JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[name];
        const cameraErrorMsg = cameraJitsiTrackErrorMsg
            || JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP
                .camera[JitsiTrackErrors.GENERAL];
        const additionalCameraErrorMsg = cameraJitsiTrackErrorMsg ? null : message;
        const titleKey = name === JitsiTrackErrors.PERMISSION_DENIED
            ? 'deviceError.cameraPermission' : 'deviceError.cameraError';

        store.dispatch(showWarningNotification({
            description: additionalCameraErrorMsg,
            descriptionKey: cameraErrorMsg,
            titleKey
        }));

        if (isPrejoinPageVisible(store.getState())) {
            store.dispatch(setDeviceStatusWarning(titleKey));
        }

        break;
    }
    case NOTIFY_MIC_ERROR: {
        if (typeof APP !== 'object' || !action.error) {
            break;
        }

        const { message, name } = action.error;

        const micJitsiTrackErrorMsg
            = JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[name];
        const micErrorMsg = micJitsiTrackErrorMsg
            || JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP
                .microphone[JitsiTrackErrors.GENERAL];
        const additionalMicErrorMsg = micJitsiTrackErrorMsg ? null : message;
        const titleKey = name === JitsiTrackErrors.PERMISSION_DENIED
            ? 'deviceError.microphonePermission'
            : 'deviceError.microphoneError';

        store.dispatch(showWarningNotification({
            description: additionalMicErrorMsg,
            descriptionKey: micErrorMsg,
            titleKey
        }));

        if (isPrejoinPageVisible(store.getState())) {
            store.dispatch(setDeviceStatusWarning(titleKey));
        }

        break;
    }
    case SET_AUDIO_INPUT_DEVICE:
        if (isPrejoinPageVisible(store.getState())) {
            store.dispatch(replaceAudioTrackById(action.deviceId));
        } else {
            APP.UI.emitEvent(UIEvents.AUDIO_DEVICE_CHANGED, action.deviceId);
        }
        break;
    case SET_VIDEO_INPUT_DEVICE:
        if (isPrejoinPageVisible(store.getState())) {
            store.dispatch(replaceVideoTrackById(action.deviceId));
        } else {
            APP.UI.emitEvent(UIEvents.VIDEO_DEVICE_CHANGED, action.deviceId);
        }
        break;
    case CHECK_AND_NOTIFY_FOR_NEW_DEVICE:
        _checkAndNotifyForNewDevice(store, action.newDevices, action.oldDevices);
        break;
    }

    return next(action);
});

/**
 * Does extra sync up on properties that may need to be updated after the
 * conference was joined.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_JOINED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _conferenceJoined({ dispatch, getState }, next, action) {
    const result = next(action);
    const state = getState();
    const { pendingRequests } = state['features/base/devices'];

    pendingRequests.forEach(request => {
        processExternalDeviceRequest(
            dispatch,
            getState,
            request,
            request.responseCallback);
    });
    dispatch(removePendingDeviceRequests());

    return result;
}

/**
 * Finds a new device by comparing new and old array of devices and dispatches
 * notification with the new device. For new devices with same groupId only one
 * notification will be shown, this is so to avoid showing multiple notifications
 * for audio input and audio output devices.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {MediaDeviceInfo[]} newDevices - The array of new devices we received.
 * @param {MediaDeviceInfo[]} oldDevices - The array of the old devices we have.
 * @private
 * @returns {void}
 */
function _checkAndNotifyForNewDevice(store, newDevices, oldDevices) {
    const { dispatch } = store;

    // let's intersect both newDevices and oldDevices and handle thew newly
    // added devices
    const onlyNewDevices = newDevices.filter(
        nDevice => !oldDevices.find(
            device => device.deviceId === nDevice.deviceId));

    // we group devices by groupID which normally is the grouping by physical device
    // plugging in headset we provide normally two device, one input and one output
    // and we want to show only one notification for this physical audio device
    const devicesGroupBy = onlyNewDevices.reduce((accumulated, value) => {
        accumulated[value.groupId] = accumulated[value.groupId] || [];
        accumulated[value.groupId].push(value);

        return accumulated;
    }, {});

    Object.values(devicesGroupBy).forEach(devicesArray => {

        if (devicesArray.length < 1) {
            return;
        }

        // let's get the first device as a reference, we will use it for
        // label and type
        const newDevice = devicesArray[0];

        // we want to strip any device details that are not very
        // user friendly, like usb ids put in brackets at the end
        const description = formatDeviceLabel(newDevice.label);

        let titleKey;

        switch (newDevice.kind) {
        case 'videoinput': {
            titleKey = 'notify.newDeviceCameraTitle';
            break;
        }
        case 'audioinput' :
        case 'audiooutput': {
            titleKey = 'notify.newDeviceAudioTitle';
            break;
        }
        }

        dispatch(showNotification({
            description,
            titleKey,
            customActionNameKey: 'notify.newDeviceAction',
            customActionHandler: _useDevice.bind(undefined, store, devicesArray)
        }));
    });
}

/**
 * Set a device to be currently used, selected by the user.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Array<MediaDeviceInfo|InputDeviceInfo>} devices - The devices to save.
 * @returns {boolean} - Returns true in order notifications to be dismissed.
 * @private
 */
function _useDevice({ dispatch }, devices) {
    devices.forEach(device => {
        switch (device.kind) {
        case 'videoinput': {
            dispatch(updateSettings({
                userSelectedCameraDeviceId: device.deviceId,
                userSelectedCameraDeviceLabel: device.label
            }));

            dispatch(setVideoInputDevice(device.deviceId));
            break;
        }
        case 'audioinput': {
            dispatch(updateSettings({
                userSelectedMicDeviceId: device.deviceId,
                userSelectedMicDeviceLabel: device.label
            }));

            dispatch(setAudioInputDevice(device.deviceId));
            break;
        }
        case 'audiooutput': {
            setAudioOutputDeviceId(
                device.deviceId,
                dispatch,
                true,
                device.label)
                .then(() => logger.log('changed audio output device'))
                .catch(err => {
                    logger.warn(
                        'Failed to change audio output device.',
                        'Default or previously set audio output device will',
                        ' be used instead.',
                        err);
                });
            break;
        }
        }
    });

    return true;
}
