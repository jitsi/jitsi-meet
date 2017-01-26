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
