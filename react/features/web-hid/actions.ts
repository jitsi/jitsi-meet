import { CLOSE_HID_DEVICE, INIT_DEVICE, REQUEST_HID_DEVICE, UPDATE_DEVICE } from './actionTypes';
import { IDeviceInfo } from './types';

/**
 * Action used to init device.
 *
 * @param {IDeviceInfo} deviceInfo - Telephony device information.
 * @returns {Object}
 */
export function initDeviceInfo(deviceInfo: IDeviceInfo) {
    return {
        type: INIT_DEVICE,
        deviceInfo
    };
}

/**
 * Request hid device.
 *
 * @returns {Object}
 */
export function closeHidDevice() {
    return {
        type: CLOSE_HID_DEVICE
    };
}

/**
 * Request hid device.
 *
 * @param {IDeviceInfo} deviceInfo - Telephony device information.
 * @returns {Object}
 */
export function requestHidDevice() {
    return {
        type: REQUEST_HID_DEVICE
    };
}

/**
 * Action used to init device.
 *
 * @param {IDeviceInfo} deviceInfo - Telephony device information.
 * @returns {Object}
 */
export function updateDeviceInfo(deviceInfo: IDeviceInfo) {
    return {
        type: UPDATE_DEVICE,
        updates: deviceInfo
    };
}
