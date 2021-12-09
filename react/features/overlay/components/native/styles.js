// @flow

import { StyleSheet } from 'react-native';

import { BoxModel, ColorPalette } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export const TEXT_COLOR = BaseTheme.palette.text01;

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
        color: TEXT_COLOR
    },

    loadingOverlayWrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },

    safeContainer: {
        flex: 1
    }
};
