import { ColorPalette, createStyleSheet } from '../../../base/styles';

import { default as platformIndependentStyles } from '../styles';

/**
 * The base/default style of indicators such as audioMutedIndicator,
 * moderatorIndicator, and videoMutedIndicator.
 */
const indicator = {
    textShadowColor: ColorPalette.black,
    textShadowOffset: {
        height: -1,
        width: 0
    }
};

/**
 * The styles of the feature filmstrip.
 */
export default createStyleSheet(platformIndependentStyles, {
    dominantSpeakerIndicator: {
        fontSize: 12
    },

    /**
     * Dominant speaker indicator background style.
     */
    dominantSpeakerIndicatorBackground: {
        borderRadius: 16,
        padding: 4
    },

    /**
     * Moderator indicator style.
     */
    moderatorIndicator: indicator,

    /**
     * Video thumbnail style.
     */
    thumbnail: {
        height: 80,
        width: 80
    },

    /**
     * Audio muted indicator style.
     */
    thumbnailIndicator: indicator
});
