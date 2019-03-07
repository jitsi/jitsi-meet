import { StyleSheet } from 'react-native';

import { ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * The React {@code Component} styles of {@code OverlayFrame}.
 */
export const overlayFrame = createStyleSheet({
    /**
     * Style for a backdrop overlay covering the screen the the overlay is
     * rendered.
     */
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: ColorPalette.black
    },

    safeContainer: {
        flex: 1
    }
});
