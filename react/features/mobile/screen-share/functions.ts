import { NativeModules } from 'react-native';

/**
 * Determines if the ScheenshareEventEmiter native module is available.
 *
 * @returns {boolean} If yes {@code true} otherwise {@code false}.
 */
export function isScreenShareAPIAvailable() {
    const { ScheenshareEventEmiter } = NativeModules;

    return ScheenshareEventEmiter !== null;
}