import { NativeModules } from 'react-native';


/**
 * Determines if the ExternalAPI native module is available.
 *
 * @returns {boolean} If yes {@code true} otherwise {@code false}.
 */
export function isExternalAPIAvailable() {
    const { ExternalAPI } = NativeModules;

    return ExternalAPI !== null;
}
