import { Amplitude } from '@amplitude/react-native';
import DefaultPreference from 'react-native-default-preference';
import DeviceInfo from 'react-native-device-info';

import logger from '../../logger';


/**
 * Custom logic for setting the correct device id.
 *
 * @param {AmplitudeClient} amplitude - The amplitude instance.
 * @returns {void}
 */
export async function fixDeviceID(amplitude: Amplitude) {
    await DefaultPreference.setName('jitsi-preferences');

    const current = await DefaultPreference.get('amplitudeDeviceId');

    if (current) {
        amplitude.setDeviceId(current);
    } else {
        const uid = DeviceInfo.getUniqueId();

        if (!uid) {
            logger.warn('Device ID is not set!');

            return;
        }

        amplitude.setDeviceId(uid);
        DefaultPreference.set('amplitudeDeviceId', uid);
    }
}
