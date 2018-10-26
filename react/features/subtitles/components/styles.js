// @flow

import { BoxModel, ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * The styles of the React {@code Component}s of the feature subtitles.
 */
export default createStyleSheet({

    /**
     * Style for subtitle paragraph.
     */
    subtitle: {
        backgroundColor: ColorPalette.black,
        borderRadius: BoxModel.margin / 4,
        color: ColorPalette.white,
        marginBottom: BoxModel.margin,
        padding: BoxModel.padding / 2
    },

    /**
     * Style for the subtitles container.
     */
    subtitlesContainer: {
        alignItems: 'center',
        flexDirection: 'column',
        flexGrow: 0,
        justifyContent: 'flex-end',
        margin: BoxModel.margin
    }
});
