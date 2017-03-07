import { createStyleSheet } from '../../styles';

/**
 * The style of the avatar and participant view UI (components).
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
     * ParticipantView style.
     */
    participantView: {
        alignItems: 'stretch',
        flex: 1
    }
});
