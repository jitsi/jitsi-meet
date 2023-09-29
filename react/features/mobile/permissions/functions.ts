import { Alert, Linking, NativeModules } from 'react-native';

import Platform from '../../base/react/Platform.native';

/**
 * Opens the settings panel for the current platform.
 *
 * @private
 * @returns {void}
 */
export function openSettings() {
    switch (Platform.OS) {
    case 'android':
        NativeModules.AndroidSettings.open().catch(() => {
            Alert.alert(
                'Error opening settings',
                'Please open settings and grant the required permissions',
                [
                    { text: 'OK' }
                ]
            );
        });
        break;

    case 'ios':
        Linking.openURL('app-settings:');
        break;
    }
}
