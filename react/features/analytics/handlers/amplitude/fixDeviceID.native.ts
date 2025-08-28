import { Types } from '@amplitude/analytics-react-native';
import DefaultPreference from 'react-native-default-preference';
import { getUniqueId } from 'react-native-device-info';

import logger from '../../logger';


/**
 * Custom logic for setting the correct device id.
 *
 * @param {Types.ReactNativeClient} amplitude - The amplitude instance.
 * @returns {void}
 */
export async function fixDeviceID(amplitude: Types.ReactNativeClient) {
    await DefaultPreference.setName('jitsi-preferences');

    const current = await DefaultPreference.get('amplitudeDeviceId');

    if (current) {
        amplitude.setDeviceId(current);
    } else {
        const uid = await getUniqueId();

        if (!uid) {
            logger.warn('Device ID is not set!');

            return;
        }

        amplitude.setDeviceId(uid as string);
        await DefaultPreference.set('amplitudeDeviceId', uid as string);
    }
}
