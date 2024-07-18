import { NativeModules } from 'react-native';

/**
 * Determines if the ScreenShareEventEmitter native module is available.
 *
 * @returns {boolean} If yes {@code true} otherwise {@code false}.
 */
export function isScreenShareAPIAvailable() {
    const { ScreenShareEventEmitter } = NativeModules;

    return ScreenShareEventEmitter !== null;
}
