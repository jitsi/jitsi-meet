import { IReduxState } from '../app/types';

import { IDeviceInfo } from './types';
import WebHidManager from './webhid-manager';

/**
 * Returns instance of web hid manager.
 *
* @returns {WebHidManager}  - WebHidManager instance.
 */
export function getWebHidInstance(): WebHidManager {
    const hidManager = WebHidManager.getInstance();

    return hidManager;
}

/**
 * Returns root conference state.
 *
 * @param {IReduxState} state - Global state.
 * @returns {Object} Conference state.
 */
export const getWebHidState = (state: IReduxState) => state['features/web-hid'];

/**
 * Returns true if hid is supported.
 *
 * @returns {boolean}
 */
export function isDeviceHidSupported(): boolean {
    const hidManager = getWebHidInstance();

    return hidManager.isSupported();
}

/**
 * Returns device info from state.
 *
 * @param {IReduxState} state - Global state.
 * @returns {boolean}
 */
export function getDeviceInfo(state: IReduxState): IDeviceInfo {
    const hidState = getWebHidState(state);

    return hidState.deviceInfo;
}

/**
 * Returns true if there is a device info stored in store.
 *
 * @param {IDeviceInfo} deviceInfo - Device info state.
 * @returns {boolean}
 */
export function shouldRequestHIDDevice(deviceInfo: IDeviceInfo): boolean {

    return !deviceInfo || Object.keys(deviceInfo).length === 0;
}
