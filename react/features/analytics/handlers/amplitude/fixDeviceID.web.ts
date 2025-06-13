// @ts-ignore
import { jitsiLocalStorage } from '@jitsi/js-utils';
import { AmplitudeClient } from 'amplitude-js';

import logger from '../../logger';

/**
 * Key used to store the device id in local storage.
 */
const DEVICE_ID_KEY = '__AMDID';

/**
 * Custom logic for setting the correct device id.
 *
 * @param {AmplitudeClient} amplitude - The amplitude instance.
 * @returns {Promise}
 */
export function fixDeviceID(amplitude: AmplitudeClient): Promise<any> {
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
        const newDeviceId = amplitude.options.deviceId;

        jitsiLocalStorage.setItem(DEVICE_ID_KEY, JSON.stringify(newDeviceId));
    }

    return Promise.resolve(true);
}
