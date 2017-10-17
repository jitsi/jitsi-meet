/* @flow */
import { NativeModules } from 'react-native';

export * from './getRouteToRender';

/**
 * Returns application name.
 *
 * @returns {string} The application name.
 */
export function getName() {
    return NativeModules.AppInfo.name;
}
