// @flow

import { BoxModel, ColorPalette } from '../../../base/styles';

/**
 * The styles of the feature chat.
 *
 * NOTE: Sizes and colors come from the 8x8 guidelines. This is the first
 * component to receive this treating, if others happen to have similar, we
 * need to extract the brand colors and sizes into a branding feature (planned
 * for the future).
 */
export default {

    /**
     * Wrapper View for the avatar.
     */
    avatarWrapper: {
        marginRight: 8
    },

    /**
     * Background of the chat screen.
     */
    backdrop: {
        backgroundColor: ColorPalette.white,
        flex: 1
    },

    chatContainer: {
        alignItems: 'stretch',
        flex: 1,
        flexDirection: 'column'
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
     * A special padding to avoid issues on some devices (such as Android devices with custom suggestions bar).
     */
    extraBarPadding: {
        paddingBottom: 30
    },

    inputBar: {
        borderTopColor: 'rgb(209, 219, 231)',
        borderTopWidth: 1,
        flexDirection: 'row',
        paddingHorizontal: BoxModel.padding
    },

    inputField: {
        flex: 1,
        height: 48
    },

    messageContainer: {
        flex: 1
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
        color: 'rgb(164, 184, 209)',
        fontSize: 13
    }
};
