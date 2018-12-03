import { Platform } from 'react-native';

// FIXME The import of react-native-vector-icons makes the file native-specific
// but the file's name and/or location (within the directory structure) don't
// reflect that, it suggests the file is platform-independent.
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';

import icoMoonConfig from '../../../../fonts/selection.json';

/**
 * Creates the Jitsi icon set from the ico moon project config file.
 */
export const Icon = createIconSetFromIcoMoon(icoMoonConfig);

// Dynamically load font on iOS
if (Platform.OS === 'ios') {
    Icon.loadFont('jitsi.ttf');
}
