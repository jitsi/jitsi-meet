import { Types } from '@amplitude/analytics-browser';
// @ts-ignore
import { jitsiLocalStorage } from '@jitsi/js-utils';

import logger from '../../logger';

/**
 * Key used to store the device id in local storage.
 */
const DEVICE_ID_KEY = '__AMDID';

/**
 * Custom logic for setting the correct device id.
 *
 * @param {Types.BrowserClient} amplitude - The amplitude instance.
 * @returns {void}
 */
export function fixDeviceID(amplitude: Types.BrowserClient) {
    const deviceId = jitsiLocalStorage.getItem(DEVICE_ID_KEY);

    if (deviceId) {
        // Set the device id in Amplitude.
        try {
            amplitude.setDeviceId(JSON.parse(deviceId));
        } catch (error) {
            logger.error('Failed to set device ID in Amplitude', error);

            return Promise.resolve(false);
        }
    } else {
        const newDeviceId = amplitude.getDeviceId();

        if (newDeviceId) {
            jitsiLocalStorage.setItem(DEVICE_ID_KEY, JSON.stringify(newDeviceId));
        }
    }
}

/**
 * Returns the amplitude shared deviceId.
 *
 * @returns {string} - The amplitude deviceId.
 */
export function getDeviceID() {
    return jitsiLocalStorage.getItem(DEVICE_ID_KEY);
}
