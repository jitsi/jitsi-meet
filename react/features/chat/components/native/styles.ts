import { MD_ITEM_MARGIN_PADDING } from '../../../base/dialog/components/native/styles';
import { BoxModel } from '../../../base/styles/components/styles/BoxModel';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const BUBBLE_RADIUS = 8;

// Matches the chat input (native Input) so both fields line up.
const SEARCH_BAR_BORDER_WIDTH = 2;
const SEARCH_BAR_HEIGHT = BaseTheme.spacing[7];
const SEARCH_BAR_INNER_HEIGHT = SEARCH_BAR_HEIGHT - (2 * SEARCH_BAR_BORDER_WIDTH);

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

    chatDisabled: {
        padding: BaseTheme.spacing[2],
        textAlign: 'center'
    },

    emptyComponentText: {
        ...BaseTheme.typography.bodyLongBold,
        color: BaseTheme.palette.text02,
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

    activeMatchMessageBubble: {
        backgroundColor: BaseTheme.palette.warning02
    },

    hiddenMessageWrapper: {
        opacity: 0
    },

    // Outline, not border, so the copy keeps the original's size.
    previewMessageBubble: {
        outlineColor: BaseTheme.palette.action01,
        outlineStyle: 'solid',
        outlineWidth: 2
    },

    chatMessageHighlight: {
        backgroundColor: BaseTheme.palette.action02,
        color: BaseTheme.palette.text01
    },

    chatMessageHighlightActive: {
        backgroundColor: BaseTheme.palette.action01,
        color: BaseTheme.palette.text01
    },

    searchBarContainer: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui03,
        borderColor: BaseTheme.palette.ui03,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: SEARCH_BAR_BORDER_WIDTH,
        flexDirection: 'row',
        height: SEARCH_BAR_HEIGHT,
        marginBottom: BaseTheme.spacing[1],
        marginHorizontal: BaseTheme.spacing[4],
        marginTop: BaseTheme.spacing[2],
        paddingLeft: BaseTheme.spacing[3],
        paddingRight: BaseTheme.spacing[2]
    },

    searchBarContainerFocused: {
        borderColor: BaseTheme.palette.focus01
    },

    searchBarCounter: {
        ...BaseTheme.typography.labelRegular,
        color: BaseTheme.palette.text03,
        marginHorizontal: BaseTheme.spacing[1]
    },

    searchBarNavButton: {
        alignItems: 'center',
        alignSelf: 'stretch',
        justifyContent: 'center',
        padding: BaseTheme.spacing[1]
    },

    searchClearButton: {
        alignItems: 'center',
        height: SEARCH_BAR_INNER_HEIGHT,
        justifyContent: 'center',
        top: 0
    },

    searchInputContainer: {
        flex: 1,
        marginBottom: 0
    },

    searchInput: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        height: SEARCH_BAR_INNER_HEIGHT,
        paddingHorizontal: 0
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: BoxModel.padding,
        maxWidth: '80%'
    },

    emptyListStyle: {
        flex: 1
    },

    emptyListContentContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
    },

    disabledSendWrapper: {
        alignSelf: 'center',
        flex: 0,
        padding: BoxModel.padding,
        paddingBottom: '8%',
        paddingTop: '8%',
        maxWidth: '80%'
    },

    /**
     * A special padding to avoid issues on some devices (such as Android devices with custom suggestions bar).
     */
    extraBarPadding: {
        paddingBottom: BaseTheme.spacing[6]
    },

    inputBar: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        width: '100%'
    },

    sendButton: {
        marginRight: BaseTheme.spacing[4],
        marginLeft: BaseTheme.spacing[2]
    },

    customInputContainer: {
        marginLeft: BaseTheme.spacing[4],
        flex: 1
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
        flexGrow: 1,
        height: undefined,
        resizeMode: 'contain',
        width: 250
    },

    gifMedia: {
        height: 150,
        resizeMode: 'contain',
        width: 250,
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
    },

    messageMenuItem: {
        alignItems: 'center',
        flexDirection: 'row',
        height: BaseTheme.spacing[7],
        paddingHorizontal: MD_ITEM_MARGIN_PADDING
    },

    messageMenuItemText: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        color: BaseTheme.palette.text01,
        marginLeft: BaseTheme.spacing[3]
    },

    emojiSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: BaseTheme.spacing[2],
        paddingHorizontal: MD_ITEM_MARGIN_PADDING
    },

    emojiSelectorItem: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui03,
        borderRadius: 26,
        height: 52,
        justifyContent: 'center',
        width: 52
    },

    emojiSelectorEmoji: {
        fontSize: 26
    },

    // Overlaps the bubble's bottom edge, as in the spec.
    reactionsChip: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui03,
        borderColor: BaseTheme.palette.ui01,
        borderRadius: 14,
        borderWidth: 2,
        flexDirection: 'row',
        height: 28,
        marginLeft: BaseTheme.spacing[2],
        marginTop: -6,
        paddingHorizontal: BaseTheme.spacing[2]
    },

    reactionsChipEmoji: {
        fontSize: 14
    },

    reactionsChipCount: {
        color: BaseTheme.palette.text02,
        fontSize: 12,
        marginLeft: BaseTheme.spacing[1]
    },

    editedLabel: {
        color: BaseTheme.palette.text03,
        fontSize: 12,
        marginTop: BaseTheme.spacing[1]
    },

    messageListArea: {
        flex: 1
    },

    // Floats over the bottom of the message list, above the input bar.
    copiedHint: {
        alignSelf: 'center',
        backgroundColor: BaseTheme.palette.ui03,
        borderRadius: BaseTheme.shape.borderRadius,
        bottom: BaseTheme.spacing[2],
        paddingHorizontal: BaseTheme.spacing[3],
        paddingVertical: BaseTheme.spacing[2],
        position: 'absolute'
    },

    copiedHintText: {
        ...BaseTheme.typography.bodyShortRegular,
        color: BaseTheme.palette.text01
    },

    editingBanner: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui02,
        borderBottomRightRadius: BaseTheme.shape.borderRadius,
        borderLeftColor: BaseTheme.palette.action01,
        borderLeftWidth: 3,
        borderTopRightRadius: BaseTheme.shape.borderRadius,
        flexDirection: 'row',
        marginBottom: BaseTheme.spacing[2],
        marginHorizontal: BaseTheme.spacing[4],
        marginTop: BaseTheme.spacing[2],
        paddingLeft: BaseTheme.spacing[2]
    },

    editingBannerText: {
        flex: 1,
        marginHorizontal: BaseTheme.spacing[2]
    },

    editingBannerTitle: {
        ...BaseTheme.typography.labelBold,
        color: BaseTheme.palette.action01
    },

    editingBannerMessage: {
        ...BaseTheme.typography.labelRegular,
        color: BaseTheme.palette.text02
    }
};

/**
 * Styles for the ClosedCaptions component.
 */
export const closedCaptionsStyles = {
    container: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    emptyContentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    emptyContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: BaseTheme.spacing[3]
    },

    emptyStateText: {
        ...BaseTheme.typography.bodyLongBold,
        color: BaseTheme.palette.text02,
        textAlign: 'center',
        maxWidth: '80%'
    },

    transcribingContainer: {
        flex: 1
    },

    languageButtonContainer: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        padding: BaseTheme.spacing[3]
    },

    languageButtonText: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        color: BaseTheme.palette.text01,
        marginHorizontal: BaseTheme.spacing[2]
    },

    languageButtonContent: {
        flexDirection: 'row'
    },

    subtitleMessageContainer: {
        backgroundColor: BaseTheme.palette.ui02,
        borderRadius: BaseTheme.shape.borderRadius,
        padding: BaseTheme.spacing[2],
        maxWidth: '100%',
        marginTop: BaseTheme.spacing[1]
    },

    subtitleMessageContent: {
        maxWidth: '100%',
        flex: 1
    },

    subtitleMessageHeader: {
        ...BaseTheme.typography.labelBold,
        color: BaseTheme.palette.text02,
        marginBottom: BaseTheme.spacing[1],
        maxWidth: 130
    },

    subtitleMessageText: {
        ...BaseTheme.typography.bodyShortRegular,
        color: BaseTheme.palette.text01
    },

    subtitleMessageTimestamp: {
        ...BaseTheme.typography.labelRegular,
        color: BaseTheme.palette.text03,
        marginTop: BaseTheme.spacing[1]
    },

    subtitleMessageInterim: {
        opacity: 0.7
    },

    subtitlesGroupContainer: {
        flexDirection: 'row',
        marginBottom: BaseTheme.spacing[3]
    },

    subtitlesGroupAvatar: {
        marginBottom: BaseTheme.spacing[10],
        marginRight: BaseTheme.spacing[2],
        alignSelf: 'flex-start',
        width: 32
    },

    subtitlesGroupMessagesContainer: {
        flexDirection: 'column',
        flex: 1,
        maxWidth: '100%'
    },

    subtitlesMessagesContainer: {
        flex: 1,
        position: 'relative',
        height: '100%'
    },

    subtitlesMessagesList: {
        padding: BaseTheme.spacing[4]
    },

    newMessagesButtonContainer: {
        position: 'absolute',
        bottom: BaseTheme.spacing[3],
        alignSelf: 'center'
    },

    messagesContainer: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
    }
};
