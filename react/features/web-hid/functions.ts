import { IReduxState, IStore } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import { muteLocal } from '../video-menu/actions.any';

import { updateDeviceInfo } from './actions';
import { ACTION_HOOK_TYPE_NAME, EVENT_TYPE, IDeviceInfo } from './types';
import WebHidManager from './webhid-manager';

/**
 * Attach web hid event listeners.
 *
 * @param {Function} initDeviceListener - Init hid device listener.
 * @param {Function} updateDeviceListener - Update hid device listener.
 * @returns {void}
 */
export function attachHidEventListeners(
        initDeviceListener: EventListenerOrEventListenerObject,
        updateDeviceListener: EventListenerOrEventListenerObject
) {
    const hidManager = getWebHidInstance();

    if (typeof initDeviceListener === 'function') {
        hidManager.addEventListener(EVENT_TYPE.INIT_DEVICE, initDeviceListener);
    }
    if (typeof updateDeviceListener === 'function') {
        hidManager.addEventListener(EVENT_TYPE.UPDATE_DEVICE, updateDeviceListener);
    }
}

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
 * Handles updating hid device.
 *
 * @param {Function} dispatch - Redux dispatch.
 * @param {Function} customEventData - Custom event data.
 * @returns {void}
 */
export function handleUpdateHidDevice(
        dispatch: IStore['dispatch'],
        customEventData: CustomEvent<{ actionResult?: { eventName: string; }; deviceInfo: IDeviceInfo; }>
) {
    dispatch(updateDeviceInfo(customEventData.detail.deviceInfo));

    if (customEventData.detail?.actionResult?.eventName === ACTION_HOOK_TYPE_NAME.MUTE_SWITCH_ON) {
        dispatch(muteLocal(true, MEDIA_TYPE.AUDIO));
    } else if (customEventData.detail?.actionResult?.eventName === ACTION_HOOK_TYPE_NAME.MUTE_SWITCH_OFF) {
        dispatch(muteLocal(false, MEDIA_TYPE.AUDIO));
    }
}

/**
 * Remove web hid event listeners.
 *
 * @param {Function} initDeviceListener - Init hid device listener.
 * @param {Function} updateDeviceListener - Update hid device listener.
 * @returns {void}
 */
export function removeHidEventListeners(
        initDeviceListener: EventListenerOrEventListenerObject,
        updateDeviceListener: EventListenerOrEventListenerObject
) {
    const hidManager = getWebHidInstance();

    if (typeof initDeviceListener === 'function') {
        hidManager.removeEventListener(EVENT_TYPE.INIT_DEVICE, initDeviceListener);
    }
    if (typeof updateDeviceListener === 'function') {
        hidManager.removeEventListener(EVENT_TYPE.UPDATE_DEVICE, updateDeviceListener);
    }
}

/**
 * Returns true if there is no device info provided.
 *
 * @param {IDeviceInfo} deviceInfo - Device info state.
 * @returns {boolean}
 */
export function shouldRequestHIDDevice(deviceInfo: IDeviceInfo): boolean {
    return !deviceInfo?.device || Object.keys(deviceInfo).length === 0;
}
