import { ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * The style of the conference UI (component).
 */
export const styles = createStyleSheet({
    /**
     * Avatar style.
     */
    avatar: {
        flex: 1,
        width: '100%'
    },

    /**
     * Conference style.
     */
    conference: {
        alignSelf: 'stretch',
        backgroundColor: ColorPalette.appBackground,

        // XXX These properties are a workaround for Android views clipping,
        // RN doesn't properly blit our overlays on top of video views.
        borderColor: ColorPalette.appBackground,
        borderWidth: 0.2,

        flex: 1
    },

    /**
     * ParticipantView style
     */
    participantView: {
        alignItems: 'stretch',
        flex: 1
    }
});
