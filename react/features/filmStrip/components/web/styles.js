import { createStyleSheet } from '../../../base/styles';

import { styles as platformIndependentStyles } from '../styles';

/**
 * Web-specific styles for the film strip.
 */
export const styles = createStyleSheet(platformIndependentStyles, {

    /**
     * Audio muted indicator style.
     */
    audioMutedIndicator: {
        textShadow: '1px 1px 2px black'
    },

    /**
     * Dominant speaker indicator background style.
     */
    dominantSpeakerIndicatorBackground: {
        height: 15,
        width: 15
    },

    /**
     * Moderator indicator style.
     */
    moderatorIndicator: {
        textShadow: '1px 1px 2px black'
    },

    /**
     * Video thumbnail style.
     */
    thumbnail: {
        height: 120,
        width: 120
    },

    /**
     * Video muted indicator style.
     */
    videoMutedIndicator: {
        textShadow: '1px 1px 2px black'
    }
});
