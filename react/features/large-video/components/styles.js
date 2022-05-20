import { StyleSheet } from 'react-native';

import { ColorSchemeRegistry } from '../../base/color-scheme';
import BaseTheme from '../../base/ui/components/BaseTheme.native';


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
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        justifyContent: 'center'
    }
});
