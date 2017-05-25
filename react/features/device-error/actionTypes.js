import { Symbol } from '../base/react';

/**
 * The type of the action which signals to update whether or not the device
 * error dialog should open for the passed in errorType.
 *
 * {
 *     type: SET_DEVICE_ERROR_DIALOG_PREFERENCE,
 *     errorType: string,
 *.    doNotShow: boolean
 * }
 */
export const SET_DEVICE_ERROR_DIALOG_PREFERENCE
    = Symbol('SET_DEVICE_ERROR_DIALOG_PREFERENCE');
