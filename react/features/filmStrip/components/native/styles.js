import { ColorPalette, createStyleSheet } from '../../../base/styles';

import { styles as platformIndependentStyles } from '../styles';

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
 * Native-specific styles for the film strip.
 */
export const styles = createStyleSheet(platformIndependentStyles, {

    /**
     * Audio muted indicator style.
     */
    audioMutedIndicator: indicator,

    /**
     * Dominant speaker indicator background style.
     */
    dominantSpeakerIndicatorBackground: {
        borderRadius: 15,
        padding: 5
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
     * Video muted indicator style.
     */
    videoMutedIndicator: indicator
});
