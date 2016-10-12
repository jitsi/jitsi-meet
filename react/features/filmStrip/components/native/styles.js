import { createStyleSheet } from '../../../base/styles';

import { styles as platformIndependentStyles } from '../styles';

/**
 * Native-specific styles for the film strip.
 */
export const styles = createStyleSheet(platformIndependentStyles, {

    /**
     * Audio muted indicator style.
     */
    audioMutedIndicator: {
        textShadowColor: 'black',
        textShadowOffset: {
            height: -1,
            width: 0
        }
    },

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
    moderatorIndicator: {
        textShadowColor: 'black',
        textShadowOffset: {
            height: -1,
            width: 0
        }
    },

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
    videoMutedIndicator: {
        textShadowColor: 'black',
        textShadowOffset: {
            height: -1,
            width: 0
        }
    }
});
