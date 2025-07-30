import amplitude from '@amplitude/analytics-react-native';

export default amplitude;

/**
 * Initializes the Amplitude instance.
 *
 * @param {string} amplitudeAPPKey - The Amplitude app key.
 * @param {string | undefined} user - The user ID.
 * @returns {Promise} The initialized Amplitude instance.
 */
export function initAmplitude(
        amplitudeAPPKey: string, user: string | undefined): Promise<unknown> {
    return amplitude.init(amplitudeAPPKey, user, {}).promise;
}
