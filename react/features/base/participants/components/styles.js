import { BoxModel, ColorPalette, createStyleSheet } from '../../styles';

/**
 * The styles of the feature base/participants.
 */
export default createStyleSheet({
    /**
     * The style of the avatar of the participant.
     */
    avatar: {
        alignSelf: 'center',
        flex: 0
    },

    /**
     * Style for the text rendered when there is a connectivity problem.
     */
    connectionInfoText: {
        color: ColorPalette.white,
        fontSize: 12,
        marginVertical: BoxModel.margin,
        marginHorizontal: BoxModel.margin,
        textAlign: 'center'
    },

    /**
     * Style for the container of the text rendered when there is a
     * connectivity problem.
     */
    connectionInfoContainer: {
        alignSelf: 'center',
        backgroundColor: ColorPalette.darkGrey,
        borderRadius: 20,
        marginTop: BoxModel.margin
    },

    /**
     * {@code ParticipantView} style.
     */
    participantView: {
        alignItems: 'stretch',
        flex: 1,
        justifyContent: 'center'
    }
});
