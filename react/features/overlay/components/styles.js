import { StyleSheet } from 'react-native';

import { BoxModel, ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * The default color of text on overlays.
 */
const TEXT_COLOR = ColorPalette.white;

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
        backgroundColor: ColorPalette.red
    }
});

/**
 * The React {@code Component} styles of {@code PageReloadOverlay}.
 */
export const pageReloadOverlay = createStyleSheet({
    /**
     * Style for the buttons on {@code PageReloadOverlay}.
     */
    button: {
        color: TEXT_COLOR,
        fontSize: 20,
        marginVertical: BoxModel.margin,
        textAlign: 'center'
    },

    /**
     * Style for the "box" surrounding the buttons at the bottom of the page.
     */
    buttonBox: {
        bottom: BoxModel.margin,
        left: 0,
        position: 'absolute',
        right: 0
    },

    /**
     * Style for the container of the {@code PageReloadOVerlay}.
     */
    container: {
        flex: 1,
        margin: BoxModel.margin * 2
    },

    /**
     * Style for the {@code LoadingIndicator}.
     */
    loadingIndicator: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center'
    },

    /**
     * Style for the descriptive error message.
     */
    message: {
        color: TEXT_COLOR,
        fontSize: 16,
        marginTop: BoxModel.margin,
        textAlign: 'center'
    },

    /**
     * Style for the error title.
     */
    title: {
        color: TEXT_COLOR,
        fontSize: 24,
        textAlign: 'center'
    }
});
