// @flow

import { StyleSheet } from 'react-native';

import { ColorSchemeRegistry, schemeColor } from '../../../base/color-scheme';
import { BoxModel, ColorPalette } from '../../../base/styles';

/**
 * The React {@code Component} styles of the overlay feature.
 */
export default {
    connectIndicator: {
        margin: BoxModel.margin
    },

    /**
     * Style for a backdrop overlay covering the screen the the overlay is
     * rendered.
     */
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: ColorPalette.black
    },

    loadingOverlayText: {
        color: ColorPalette.white
    },

    loadingOverlayWrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },

    safeContainer: {
        flex: 1
    }
};

/**
 * Color schemed styles for all the component based on the abstract dialog.
 */
ColorSchemeRegistry.register('LoadConfigOverlay', {
    indicatorColor: schemeColor('text'),

    loadingOverlayText: {
        color: schemeColor('text')
    },

    loadingOverlayWrapper: {
        backgroundColor: schemeColor('background')
    }
});
