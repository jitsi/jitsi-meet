import { StyleSheet } from 'react-native';

import { ColorPalette } from '../../../styles';

/**
 * The styles of the feature base/media.
 */
export default StyleSheet.create({
    /**
     * Make {@code Video} fill its container.
     */
    video: {
        flex: 1
    },

    /**
     * Black cover for the video, which will be animated by reducing its opacity
     * and create a fade-in effect.
     */
    videoCover: {
        backgroundColor: ColorPalette.black,
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    }
});
