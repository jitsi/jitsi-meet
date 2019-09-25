// @flow

import {
    SPOT_DEVICES_DETECTED,
    TOGGLE_SPOT_CONTROLLER_VIEW,
    TOGGLE_SPOT_DEVICES_LIST
} from './actionTypes';

/**
 * Action to be dispatched when new spot devices are detected.
 *
 * @param {Array<Object>} devices - The detected spot devices.
 * @returns {{
 *     type: SPOT_DEVICES_DETECTED
 * }}
 */
export function spotDevicesDetected(devices: Array<Object>): Object {
    return {
        devices,
        type: SPOT_DEVICES_DETECTED
    };
}

/**
 * Action to be dispatched to toggle the spot controller view on or off.
 *
 * @param {boolean} show - Boolean to show or hide the view.
 * @param {Object} device - The device to control, if it's defined
 * upon opening the view (e.g. A detected nearby device).
 * @returns {{
 *     device: ?Object,
 *     show: boolean,
 *     type: TOGGLE_SPOT_CONTROLLER_VIEW
 * }}
 */
export function toggleSpotControllerView(show: boolean, device: ?Object): Object {
    return {
        device,
        show,
        type: TOGGLE_SPOT_CONTROLLER_VIEW
    };
}

/**
 * Action to be dispatched to toggle the spot devices list screen on or off.
 *
 * @param {boolean} show - Boolean to show or hide the screen.
 * @returns {{
 *     show: boolean,
 *     type: TOGGLE_SPOT_DEVICES_LIST
 * }}
 */
export function toggleSpotDevicesList(show: boolean): Object {
    return {
        show,
        type: TOGGLE_SPOT_DEVICES_LIST
    };
}
