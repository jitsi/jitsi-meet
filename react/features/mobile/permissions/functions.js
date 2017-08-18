import { Alert, Linking, NativeModules } from 'react-native';

import { Platform } from '../../base/react';

/**
 * Shows an alert panel which tells the user they have to manually grant some
 * permissions by opening Settings. A button which opens Settings is provided.
 *
 * FIXME: translate.
 *
 * @param {string} trackType - Type of track that failed with a permission
 * error.
 * @returns {void}
 */
export function alertPermissionErrorWithSettings(trackType) {
    const type = trackType === 'video' ? 'Camera' : 'Microphone';

    Alert.alert(
        'Permissions Error',
        `${type} permission is required, please enable it in Settings.`,
        [
            { text: 'Cancel' },
            {
                onPress: _openSettings,
                text: 'Settings'
            }
        ],
        { cancelable: false });
}

/**
 * Opens the settings panel for the current platform.
 *
 * @private
 * @returns {void}
 */
function _openSettings() {
    switch (Platform.OS) {
    case 'android':
        NativeModules.AndroidSettings.open();
        break;

    case 'ios':
        Linking.openURL('app-settings:');
        break;
    }
}
