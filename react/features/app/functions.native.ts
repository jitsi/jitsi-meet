import { NativeModules } from 'react-native';

import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';
import { getServerURL } from '../base/settings/functions.native';

export * from './functions.any';

/**
 * Retrieves the default URL for the app. This can either come from a prop to
 * the root App component or be configured in the settings.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {string} - Default URL for the app.
 */
export function getDefaultURL(stateful: IStateful) {
    const state = toState(stateful);

    return getServerURL(state);
}

/**
 * Returns application name.
 *
 * @returns {string} The application name.
 */
export function getName() {
    return NativeModules.AppInfo.name;
}

/**
 * Returns the path to the Jitsi Meet SDK bundle on iOS. On Android it will be
 * undefined.
 *
 * @returns {string|undefined}
 */
export function getSdkBundlePath() {
    return NativeModules.AppInfo.sdkBundlePath;
}
