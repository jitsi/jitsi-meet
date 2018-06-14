// @flow

import { BoxModel, ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * The styles of the React {@code Components} of the feature recording.
 */
export default createStyleSheet({

    /**
     * Style for the recording indicator.
     */
    indicatorLive: {
        backgroundColor: ColorPalette.blue
    },

    /**
     * Style for the recording indicator.
     */
    indicatorRecording: {
        backgroundColor: ColorPalette.red
    },

    messageContainer: {
        paddingHorizontal: BoxModel.padding,
        paddingVertical: 1.5 * BoxModel.padding
    }
});
