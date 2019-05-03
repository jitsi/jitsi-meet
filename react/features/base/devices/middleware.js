/* global APP */

import { CONFERENCE_JOINED } from '../conference';
import { processExternalDeviceRequest } from '../../device-selection';
import { MiddlewareRegistry } from '../redux';
import UIEvents from '../../../../service/UI/UIEvents';

import {
    removePendingDeviceRequests,
    setAudioInputDevice,
    setVideoInputDevice
} from './actions';
import {
    CHECK_AND_NOTIFY_FOR_NEW_DEVICE,
    SET_AUDIO_INPUT_DEVICE,
    SET_VIDEO_INPUT_DEVICE
} from './actionTypes';
import { showNotification } from '../../notifications';
import { updateSettings } from '../settings';
import { setAudioOutputDeviceId } from './functions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
    case SET_AUDIO_INPUT_DEVICE:
        APP.UI.emitEvent(UIEvents.AUDIO_DEVICE_CHANGED, action.deviceId);
        break;
    case SET_VIDEO_INPUT_DEVICE:
        APP.UI.emitEvent(UIEvents.VIDEO_DEVICE_CHANGED, action.deviceId);
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
 * notification with the new device.
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

    onlyNewDevices.forEach(newDevice => {

        // we want to strip any device details that are not very
        // user friendly, like usb ids put in brackets at the end
        let description = newDevice.label;
        const ix = description.lastIndexOf('(');

        if (ix !== -1) {
            description = description.substr(0, ix);
        }

        let titleKey;

        switch (newDevice.kind) {
        case 'videoinput': {
            titleKey = 'notify.newDeviceCameraTitle';
            break;
        }
        case 'audioinput': {
            titleKey = 'notify.newDeviceMicTitle';
            break;
        }
        case 'audiooutput': {
            titleKey = 'notify.newDeviceCameraTitle';
            break;
        }
        }

        dispatch(showNotification({
            description,
            titleKey,
            customActionNameKey: 'notify.newDeviceAction',
            customActionHandler: _useDevice.bind(undefined, store, newDevice)
        }));
    });
}

/**
 * Set a device to be currently used, selected by the user.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {MediaDeviceInfo} device - The device to save.
 * @returns {boolean} - Returns true in order notifications to be dismissed.
 * @private
 */
function _useDevice({ dispatch }, device) {
    switch (device.kind) {
    case 'videoinput': {
        dispatch(updateSettings({
            userSelectedCameraDeviceId: device.deviceId
        }));

        dispatch(setVideoInputDevice(device.deviceId));
        break;
    }
    case 'audioinput': {
        dispatch(updateSettings({
            userSelectedMicDeviceId: device.deviceId
        }));

        dispatch(setAudioInputDevice(device.deviceId));
        break;
    }
    case 'audiooutput': {
        setAudioOutputDeviceId(
            device.deviceId,
            dispatch,
            true)
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

    return true;
}
