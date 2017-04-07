import { createStyleSheet } from '../../styles';

/**
 * The style of the avatar and participant view UI (components).
 */
export const styles = createStyleSheet({
    /**
     * Avatar style.
     */
    avatar: {
        alignSelf: 'center',

        // FIXME I don't understand how a 100 border radius of a 50x50 square
        // results in a circle.
        borderRadius: 100,
        flex: 1,
        height: 50,
        width: 50
    },

    /**
     * ParticipantView style.
     */
    participantView: {
        alignItems: 'stretch',
        flex: 1
    }
});
