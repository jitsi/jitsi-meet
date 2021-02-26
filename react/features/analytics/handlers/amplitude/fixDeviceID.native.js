import DefaultPreference from 'react-native-default-preference';
import DeviceInfo from 'react-native-device-info';

/**
 * Custom logic for setting the correct device id.
 *
 * @param {AmplitudeClient} amplitude - The amplitude instance.
 * @returns {void}
 */
export async function fixDeviceID(amplitude) {
    await DefaultPreference.setName('jitsi-preferences');

    const current = await DefaultPreference.get('amplitudeDeviceId');

    if (current) {
        amplitude.setDeviceId(current);
    } else {
        const uid = DeviceInfo.getUniqueId();

        amplitude.setDeviceId(uid);
        DefaultPreference.set('amplitudeDeviceId', uid);
    }
}
