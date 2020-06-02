/* global APP */

import UIEvents from '../../../../service/UI/UIEvents';
import { processExternalDeviceRequest } from '../../device-selection';
import { showWarningNotification } from '../../notifications';
import { replaceAudioTrackById, replaceVideoTrackById, setDeviceStatusWarning } from '../../prejoin/actions';
import { isPrejoinPageVisible } from '../../prejoin/functions';
import { CONFERENCE_JOINED } from '../conference';
import { JitsiTrackErrors } from '../lib-jitsi-meet';
import { MiddlewareRegistry } from '../redux';

import {
    NOTIFY_CAMERA_ERROR,
    NOTIFY_MIC_ERROR,
    SET_AUDIO_INPUT_DEVICE,
    SET_VIDEO_INPUT_DEVICE
} from './actionTypes';
import {
    removePendingDeviceRequests
} from './actions';

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
