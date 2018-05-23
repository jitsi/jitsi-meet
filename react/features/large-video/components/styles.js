import { StyleSheet } from 'react-native';

import { ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * Size for the Avatar.
 */
export const AVATAR_SIZE = 200;

export default createStyleSheet({
    /**
     * Large video container style.
     */
    largeVideo: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'stretch',
        backgroundColor: ColorPalette.appBackground,
        flex: 1,
        justifyContent: 'center'
    }
});
