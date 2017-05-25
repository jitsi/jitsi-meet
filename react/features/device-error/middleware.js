import jitsiLocalStorage from '../../../modules/util/JitsiLocalStorage';

import { MiddlewareRegistry } from '../base/redux';
import { CREATE_LOCAL_TRACKS_FAILED } from '../base/tracks';

import { openDeviceErrorDialog } from './actions';
import { SET_DEVICE_ERROR_DIALOG_PREFERENCE } from './actionTypes';

declare var interfaceConfig: Object;

const LOCAL_STORAGE_KEY = 'doNotShowErrorAgain';

/**
 * Implements middleware that captures actions related to displaying dialogs
 * when an error occurs while creating a local media track.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CREATE_LOCAL_TRACKS_FAILED: {
        const { cameraError, micError } = action;

        if (!interfaceConfig.filmStripOnly
            && (cameraError || micError)) {
            const localStorageKey = _getLocalStorageKey(cameraError, micError);

            if (_shouldShowDeviceErrorDialog(localStorageKey)) {
                store.dispatch(openDeviceErrorDialog({
                    cameraError,
                    localStorageKey,
                    micError
                }));
            }

        }

        break;
    }

    case SET_DEVICE_ERROR_DIALOG_PREFERENCE: {
        _setDeviceErrorDialogPreference(action.errorType, action.doNotShow);

        break;
    }
    }

    return next(action);
});

/**
 * Returns the local storage key used to persist whether or not a dialog should
 * display for future errors with the same types.
 *
 * @param {JitsiTrackError} cameraError - The error, if any, from attempting
 * to use a camera.
 * @param {JitsiTrackError} micError - The error, if any, from attempting to
 * use a microphone.
 * @private
 * @returns {string}
 */
function _getLocalStorageKey(cameraError, micError) {
    let localStorageKey = LOCAL_STORAGE_KEY;

    if (micError) {
        localStorageKey += `-mic-${micError.name}`;
    }

    if (cameraError) {
        localStorageKey += `-camera-${cameraError.name}`;
    }

    return localStorageKey;
}

/**
 * Persists into local storage whether or not the given errorType should display
 * a dialog if encountered again.
 *
 * @param {string} errorType - The type of device error to save the preference
 * for.
 * @param {boolean} doNotShow - The value to be stored into local storage. If
 * true, the dialog for the given errorType will not display again.
 * @private
 * @returns {void}
 */
function _setDeviceErrorDialogPreference(errorType, doNotShow) {
    if (typeof doNotShow === 'boolean') {
        jitsiLocalStorage.setItem(errorType, doNotShow);
    }
}

/**
 * Returns whether or not a device error dialog associated with the local
 * storage key should be displayed.
 *
 * @param {string} localStorageKey - The local storage key to check.
 * @private
 * @returns {boolean} True if the device error dialog should display.
 */
function _shouldShowDeviceErrorDialog(localStorageKey) {
    const localStorageValue = jitsiLocalStorage.getItem(localStorageKey);

    return !localStorageValue || localStorageValue === 'false';
}
