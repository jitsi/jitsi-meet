// @flow

import {
    ColorPalette,
    createStyleSheet
} from '../../../base/styles';

/**
 * The styles of the feature chat.
 *
 * NOTE: Sizes and colors come from the 8x8 guidelines. This is the first
 * component to receive this treating, if others happen to have similar, we
 * need to extract the brand colors and sizes into a branding feature (planned
 * for the future).
 */
export default createStyleSheet({

    /**
     * Wrapper View for the avatar.
     */
    avatarWrapper: {
        marginRight: 8
    },

    /**
     * Wrapper for the details together, such as name, message and time.
     */
    detailsWrapper: {
        alignItems: 'flex-start',
        flex: 1,
        flexDirection: 'column'
    },

    /**
     * The text node for the display name.
     */
    displayName: {
        color: 'rgb(118, 136, 152)',
        fontSize: 13
    },

    /**
     * The message text itself.
     */
    messageText: {
        color: 'rgb(28, 32, 37)',
        fontSize: 15
    },

    /**
     * Wrapper View for the entire block.
     */
    messageWrapper: {
        alignItems: 'flex-start',
        flex: 1,
        flexDirection: 'row',
        marginHorizontal: 17,
        marginVertical: 4
    },

    /**
     * Background of the chat screen. Currently it's set to a transparent value
     * as the idea is that the participant would still want to see at least a
     * part of the video when he/she is in the chat window.
     */
    modalBackdrop: {
        backgroundColor: 'rgba(127, 127, 127, 0.8)',
        flex: 1
    },

    /**
     * Style modifier for the {@code detailsWrapper} for own messages.
     */
    ownMessageDetailsWrapper: {
        alignItems: 'flex-end'
    },

    /**
     * Style modifier for the {@code textWrapper} for own messages.
     */
    ownTextWrapper: {
        backgroundColor: 'rgb(210, 231, 249)',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 0
    },

    solidBGTimeText: {
        color: 'rgb(164, 184, 209)'
    },

    /**
     * Style modifier for the chat window when we're in audio only mode.
     */
    solidModalBackdrop: {
        backgroundColor: ColorPalette.white
    },

    /**
     * Style modifier for system (error) messages.
     */
    systemTextWrapper: {
        backgroundColor: 'rgb(247, 215, 215)'
    },

    /**
     * Wrapper for the name and the message text.
     */
    textWrapper: {
        alignItems: 'flex-start',
        backgroundColor: 'rgb(240, 243, 247)',
        borderRadius: 8,
        borderTopLeftRadius: 0,
        flexDirection: 'column',
        padding: 9
    },

    /**
     * Text node for the timestamp.
     */
    timeText: {
        color: ColorPalette.white,
        fontSize: 13
    }
});
