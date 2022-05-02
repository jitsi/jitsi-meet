// @flow

import { ColorPalette, createStyleSheet } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme';

export const LIVE_LABEL_COLOR = ColorPalette.blue;

/**
 * The styles of the React {@code Components} of the feature recording.
 */
export default createStyleSheet({

    /**
     * Style for the recording indicator.
     */
    indicatorStyle: {
        marginRight: 4,
        marginLeft: 0,
        marginBottom: 0
    },

    /**
     * Style for the recording indicator.
     */
    indicatorLive: {
        backgroundColor: LIVE_LABEL_COLOR
    },

    /**
     * Style for the recording indicator.
     */
    indicatorRecording: {
        backgroundColor: BaseTheme.palette.iconError
    }
});
