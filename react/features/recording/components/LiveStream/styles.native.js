// @flow

import { BoxModel, ColorPalette, createStyleSheet } from '../../../base/styles';

/**
 * The styles of the React {@code Components} of LiveStream.
 */
export default createStyleSheet({
    betaTag: {
        backgroundColor: ColorPalette.darkGrey,
        borderRadius: 2,
        marginLeft: 16,
        opacity: 0.90,
        paddingLeft: 6,
        paddingRight: 6
    },

    betaTagText: {
        color: ColorPalette.white,
        fontWeight: 'bold'
    },

    streamKeyFormWrapper: {
        flexDirection: 'column',
        padding: BoxModel.padding
    },

    streamKeyHelp: {
        alignSelf: 'flex-end'
    },

    streamKeyInput: {
        alignSelf: 'stretch',
        height: 50
    },

    streamKeyInputLabel: {
        alignSelf: 'flex-start'
    }

});
