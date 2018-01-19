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
        height: '100%',
        left: 0,
        position: 'absolute',
        top: 0,
        width: '100%'
    }
});
