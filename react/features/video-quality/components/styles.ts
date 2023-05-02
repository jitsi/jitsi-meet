import { ColorPalette } from '../../base/styles/components/styles/ColorPalette';
import { createStyleSheet } from '../../base/styles/functions.any';
import BaseTheme from '../../base/ui/components/BaseTheme.native';

export const AUD_LABEL_COLOR = ColorPalette.green;

/**
 * The styles of the React {@code Components} of the feature video-quality.
 */
export default createStyleSheet({

    /**
     * Style for the audio-only indicator.
     */
    indicatorAudioOnly: {
        backgroundColor: AUD_LABEL_COLOR,
        borderRadius: BaseTheme.shape.borderRadius,
        height: 32
    }
});
