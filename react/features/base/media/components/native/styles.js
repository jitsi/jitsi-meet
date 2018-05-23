import { StyleSheet } from 'react-native';

import { ColorPalette } from '../../../styles';

/**
 * The styles of the feature base/media.
 */
export default StyleSheet.create({

    /**
     * Base style of the transformed video view.
     */
    videoTranformedView: {
        flex: 1
    },

    /**
     * A basic style to avoid rendering a transformed view off the component,
     * that can be visible on special occasions, such as during device rotate
     * animation, or PiP mode.
     */
    videoTransformedViewContaier: {
        overflow: 'hidden'
    },

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
        ...StyleSheet.absoluteFillObject,
        backgroundColor: ColorPalette.black
    }
});
