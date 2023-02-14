import { INIT_DEVICE, REQUEST_HID_DEVICE, UPDATE_DEVICE, UPDATE_REPORT_HID } from './actionTypes';
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
export function updateDeviceInfo(deviceInfo: Partial<IDeviceInfo>) {
    return {
        type: UPDATE_DEVICE,
        updates: deviceInfo
    };
}

/**
 * Action used to update report hid.
 *
 * @param {Map} reportResultHid - Report result of hid device.
 * @returns {Object}
 */
export function updateReportResult(reportResultHid: Map<number, boolean>) {
    return {
        type: UPDATE_REPORT_HID,
        reportResultHid
    };
}
