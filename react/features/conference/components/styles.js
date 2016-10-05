import { createStyleSheet } from '../../base/styles';

/**
 * The style of the conference UI (component).
 * TODO Make styles more generic and reusable. Use ColorPalette for all colors.
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
        backgroundColor: '#111111',
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
