// @flow

import { ColorPalette, createStyleSheet } from '../../styles';

/**
 * The styles of the native base/label feature.
 */
export default createStyleSheet({

    /**
     * The outermost view.
     */
    indicatorContainer: {
        alignItems: 'center',
        backgroundColor: '#808080',
        borderRadius: 18,
        borderWidth: 0,
        flex: 0,
        height: 36,
        justifyContent: 'center',
        margin: 5,
        opacity: 0.6,
        width: 36
    },

    indicatorText: {
        color: ColorPalette.white,
        fontSize: 12
    }
});
