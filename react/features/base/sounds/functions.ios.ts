import { getSdkBundlePath } from '../../app/functions.native';

/**
 * Returns the location of the sounds. On iOS it's the location of the SDK
 * bundle on the phone. Each sound file must be added to the SDK's XCode project
 * in order to be bundled correctly.
 *
 * @returns {string}
 */
export function getSoundsPath() {
    return getSdkBundlePath();
}
