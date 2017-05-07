import { openDialog } from '../base/dialog';

import { SET_DEVICE_ERROR_DIALOG_PREFERENCE } from './actionTypes';
import { DeviceErrorDialog } from './components';

/**
 * Opens {@code DeviceErrorDialog} with the passed in props.
 *
 * @param {Object} dialogProps - The props to pass into the dialog.
 * @returns {Function}
 */
export function openDeviceErrorDialog(dialogProps) {
    return openDialog(DeviceErrorDialog, dialogProps);
}

/**
 * Signals to save the preference for whether or not an error dialog should
 * display again for the given errorType.
 *
 * @param {string} errorType - The type of device error to save the preference
 * for.
 * @param {boolean} doNotShow - The value to be stored into local storage. If
 * true, the dialog for the given errorType will not display again.
 * @returns {{
 *     type: SET_DEVICE_ERROR_DIALOG_PREFERENCE,
 *     doNotShow: boolean,
 *     errorType: string
 * }}
 */
export function setDeviceErrorDialogPreference(errorType, doNotShow) {
    return {
        type: SET_DEVICE_ERROR_DIALOG_PREFERENCE,
        doNotShow,
        errorType
    };
}
