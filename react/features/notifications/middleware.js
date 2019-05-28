/* @flow */

import { APP_WILL_MOUNT } from '../base/app';
import { getCurrentConference } from '../base/conference';
import { NOTIFY_CAMERA_ERROR, NOTIFY_MIC_ERROR } from '../base/devices';
import { JitsiTrackErrors } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { clearNotifications, showWarningNotification } from './actions';

const JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP = {
    microphone: {},
    camera: {}
};

declare var APP: Object;

MiddlewareRegistry.register(store => next => action => {
    if (typeof APP !== 'object') {
        return next(action);
    }

    switch (action.type) {
    case APP_WILL_MOUNT: {
        // Deferring the setting of values on the message map until app mount is
        // a workaround for circular dependencies causing JitsiMeetJS to be
        // undefined on module load.
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP
            .camera[JitsiTrackErrors.UNSUPPORTED_RESOLUTION]
                = 'dialog.cameraUnsupportedResolutionError';
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[JitsiTrackErrors.GENERAL]
            = 'dialog.cameraUnknownError';
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[JitsiTrackErrors.PERMISSION_DENIED]
            = 'dialog.cameraPermissionDeniedError';
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[JitsiTrackErrors.NOT_FOUND]
            = 'dialog.cameraNotFoundError';
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[JitsiTrackErrors.CONSTRAINT_FAILED]
            = 'dialog.cameraConstraintFailedError';
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP
            .camera[JitsiTrackErrors.NO_DATA_FROM_SOURCE]
                = 'dialog.cameraNotSendingData';
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[JitsiTrackErrors.GENERAL]
            = 'dialog.micUnknownError';
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP
            .microphone[JitsiTrackErrors.PERMISSION_DENIED]
                = 'dialog.micPermissionDeniedError';
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[JitsiTrackErrors.NOT_FOUND]
            = 'dialog.micNotFoundError';
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP
            .microphone[JitsiTrackErrors.CONSTRAINT_FAILED]
                = 'dialog.micConstraintFailedError';
        JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP
            .microphone[JitsiTrackErrors.NO_DATA_FROM_SOURCE]
                = 'dialog.micNotSendingData';
        break;
    }

    case NOTIFY_CAMERA_ERROR: {
        if (!action.error) {
            break;
        }

        const { message, name } = action.error;

        const cameraJitsiTrackErrorMsg
            = JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[name];
        const cameraErrorMsg = cameraJitsiTrackErrorMsg
            || JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP
                .camera[JitsiTrackErrors.GENERAL];
        const additionalCameraErrorMsg = cameraJitsiTrackErrorMsg ? null : message;

        store.dispatch(showWarningNotification({
            description: additionalCameraErrorMsg,
            descriptionKey: cameraErrorMsg,
            titleKey: name === JitsiTrackErrors.PERMISSION_DENIED
                ? 'deviceError.cameraPermission' : 'deviceError.cameraError'
        }));

        break;
    }

    case NOTIFY_MIC_ERROR: {
        if (!action.error) {
            break;
        }

        const { message, name } = action.error;

        const micJitsiTrackErrorMsg
            = JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[name];
        const micErrorMsg = micJitsiTrackErrorMsg
            || JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP
                .microphone[JitsiTrackErrors.GENERAL];
        const additionalMicErrorMsg = micJitsiTrackErrorMsg ? null : message;

        store.dispatch(showWarningNotification({
            description: additionalMicErrorMsg,
            descriptionKey: micErrorMsg,
            titleKey: name === JitsiTrackErrors.PERMISSION_DENIED
                ? 'deviceError.microphonePermission'
                : 'deviceError.microphoneError'
        }));

        break;
    }
    }

    return next(action);
});

/**
 * StateListenerRegistry provides a reliable way to detect the leaving of a
 * conference, where we need to clean up the notifications.
 */
StateListenerRegistry.register(
    /* selector */ state => getCurrentConference(state),
    /* listener */ (conference, { dispatch }) => {
        if (!conference) {
            dispatch(clearNotifications());
        }
    }
);
