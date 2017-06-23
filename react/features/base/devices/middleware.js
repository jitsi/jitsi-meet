/* global APP */
import { DeviceErrorDialog } from './components';
import { openDialog } from '../dialog';
import { JitsiTrackError } from '../lib-jitsi-meet';
import UIEvents from '../../../../service/UI/UIEvents';

import { MiddlewareRegistry } from '../redux';

import {
    SET_AUDIO_INPUT_DEVICE,
    SET_AUDIO_OUTPUT_DEVICE,
    SET_VIDEO_INPUT_DEVICE,
    SHOW_DEVICE_ERROR
} from './actionTypes';

/**
 * Implements the middleware of the feature base/devices.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_AUDIO_INPUT_DEVICE:
        APP.UI.emitEvent(UIEvents.AUDIO_DEVICE_CHANGED, action.deviceId);
        break;
    case SET_AUDIO_OUTPUT_DEVICE:
        APP.UI.emitEvent(UIEvents.AUDIO_OUTPUT_DEVICE_CHANGED, action.deviceId);
        break;
    case SET_VIDEO_INPUT_DEVICE:
        APP.UI.emitEvent(UIEvents.VIDEO_DEVICE_CHANGED, action.deviceId);
        break;
    case SHOW_DEVICE_ERROR: {
        const { cameraError, micError } = action;
        const dontShowAgain = {
            localStorageKey: 'doNotShowErrorAgain',
            textKey: 'dialog.doNotShowWarningAgain'
        };

        if (micError) {
            dontShowAgain.localStorageKey += `-mic-${micError.name}`;
        }

        if (cameraError) {
            dontShowAgain.localStorageKey += `-camera-${cameraError.name}`;
        }

        const isMicJitsiTrackErrorAndHasName = micError && micError.name
            && micError instanceof JitsiTrackError;
        const isCameraJitsiTrackErrorAndHasName
            = cameraError && cameraError.name
            && cameraError instanceof JitsiTrackError;
        let showDoNotShowWarning = false;

        if (isMicJitsiTrackErrorAndHasName && cameraError
            && isCameraJitsiTrackErrorAndHasName) {
            showDoNotShowWarning = true;
        } else if (isMicJitsiTrackErrorAndHasName && !cameraError) {
            showDoNotShowWarning = true;
        } else if (isCameraJitsiTrackErrorAndHasName && !micError) {
            showDoNotShowWarning = true;
        }

        const additionalProps = {};

        if (showDoNotShowWarning) {
            additionalProps.doNotShowWarningTextKey = dontShowAgain.textKey;
            additionalProps.localStorageKeyForDoNotShowWarning
                = dontShowAgain.localStorageKey;
        }

        store.dispatch(openDialog(DeviceErrorDialog, {
            ...additionalProps,
            cameraError,
            micError
        }));
        break;
    }
    }

    return next(action);
});
