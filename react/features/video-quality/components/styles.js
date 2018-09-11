// @flow

import { ColorPalette, createStyleSheet } from '../../base/styles';

export const AUD_LABEL_COLOR = ColorPalette.green;

/**
 * The styles of the React {@code Components} of the feature video-quality.
 */
export default createStyleSheet({

    /**
     * Style for the audio-only indicator.
     */
    indicatorAudioOnly: {
        backgroundColor: AUD_LABEL_COLOR
    }
});
