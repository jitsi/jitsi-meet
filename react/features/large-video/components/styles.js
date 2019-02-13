import { StyleSheet } from 'react-native';

import { ColorSchemeRegistry, schemeColor } from '../../base/color-scheme';

/**
 * Size for the Avatar.
 */
export const AVATAR_SIZE = 200;

/**
 * Color schemed styles for the @{LargeVideo} component.
 */
ColorSchemeRegistry.register('LargeVideo', {

    /**
     * Large video container style.
     */
    largeVideo: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'stretch',
        backgroundColor: schemeColor('background'),
        flex: 1,
        justifyContent: 'center'
    }
});
