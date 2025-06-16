import { BoxModel } from '../../../base/styles/components/styles/BoxModel';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const BUBBLE_RADIUS = 8;

const recipientContainer = {
    alignItems: 'center',
    backgroundColor: BaseTheme.palette.support05,
    borderRadius: BaseTheme.shape.borderRadius,
    flexDirection: 'row',
    height: 48,
    marginBottom: BaseTheme.spacing[3],
    marginHorizontal: BaseTheme.spacing[3],
    padding: BaseTheme.spacing[2]
};

const inputBar = {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
};

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
     * Background of the chat screen.
     */
    backdrop: {
        backgroundColor: BaseTheme.palette.ui10,
        flex: 1
    },

    emptyComponentText: {
        color: BaseTheme.palette.text03,
        textAlign: 'center'
    },

    lobbyMessageBubble: {
        backgroundColor: BaseTheme.palette.support06
    },

    lobbyMsgNotice: {
        color: BaseTheme.palette.text04,
        fontSize: 11,
        marginTop: 6
    },

    privateNotice: {
        ...BaseTheme.palette.bodyShortRegular,
        color: BaseTheme.palette.text02
    },

    privateMessageBubble: {
        backgroundColor: BaseTheme.palette.support05
    },

    remoteMessageBubble: {
        backgroundColor: BaseTheme.palette.ui02,
        borderTopLeftRadius: 0
    },

    replyContainer: {
        alignSelf: 'stretch',
        justifyContent: 'center'
    },

    replyStyles: {
        iconStyle: {
            color: BaseTheme.palette.icon01,
            fontSize: 22,
            padding: BaseTheme.spacing[2]
        },
        underlayColor: 'transparent'
    },

    /**
     * Wrapper View for the avatar.
     */
    avatarWrapper: {
        marginRight: BaseTheme.spacing[2],
        width: 32
    },

    chatLink: {
        color: BaseTheme.palette.link01
    },

    chatMessage: {
        ...BaseTheme.typography.bodyShortRegular,
        color: BaseTheme.palette.text01
    },

    /**
     * Wrapper for the details together, such as name, message and time.
     */
    detailsWrapper: {
        alignItems: 'flex-start',
        flex: 1,
        flexDirection: 'column'
    },

    emptyComponentWrapper: {
        alignSelf: 'center',
        flex: 1,
        padding: BoxModel.padding,
        paddingTop: '8%',
        maxWidth: '80%'
    },

    /**
     * A special padding to avoid issues on some devices (such as Android devices with custom suggestions bar).
     */
    extraBarPadding: {
        paddingBottom: 30
    },

    inputBarNarrow: {
        ...inputBar,
        height: 112,
        marginHorizontal: BaseTheme.spacing[3]
    },

    inputBarWide: {
        ...inputBar,
        height: 88,
        marginHorizontal: BaseTheme.spacing[9]
    },

    customInputContainer: {
        width: '75%'
    },

    messageBubble: {
        alignItems: 'center',
        borderRadius: BUBBLE_RADIUS,
        flexDirection: 'row'
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

    replyWrapper: {
        alignItems: 'center',
        flexDirection: 'row'
    },

    /**
     * Style modifier for system (error) messages.
     */
    systemMessageBubble: {
        backgroundColor: 'rgb(247, 215, 215)'
    },

    /**
     * Wrapper for the name and the message text.
     */
    textWrapper: {
        alignItems: 'flex-start',
        flexDirection: 'column',
        padding: 9
    },

    /**
     * Text node for the timestamp.
     */
    timeText: {
        color: BaseTheme.palette.text03,
        fontSize: 13
    },

    chatContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'center'
    },

    tabLeftButton: {
        flex: 1,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0
    },

    tabRightButton: {
        flex: 1,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0
    },

    gifContainer: {
        maxHeight: 150
    },

    gifImage: {
        resizeMode: 'contain',
        width: 250,
        height: undefined,
        flexGrow: 1
    },

    senderDisplayName: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text02
    },

    localMessageBubble: {
        backgroundColor: BaseTheme.palette.ui04,
        borderTopRightRadius: 0
    },

    lobbyMessageRecipientContainer: {
        ...recipientContainer,
        backgroundColor: BaseTheme.palette.support06
    },

    messageRecipientCancelIcon: {
        color: BaseTheme.palette.icon01,
        fontSize: 18
    },

    messageRecipientContainer: {
        ...recipientContainer
    },

    messageRecipientText: {
        ...BaseTheme.typography.bodyShortRegular,
        color: BaseTheme.palette.text01,
        flex: 1
    }
};
