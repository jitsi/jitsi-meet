import { MD_ITEM_HEIGHT } from '../../../base/dialog/components/native/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

/**
 * The style for participant list description.
 */
const participantListDescription = {
    ...BaseTheme.typography.heading6,
    color: BaseTheme.palette.text02,
    paddingBottom: BaseTheme.spacing[3],
    paddingTop: BaseTheme.spacing[3],
    position: 'relative',
    width: '55%'
};

/**
 * The style for content.
 */
const flexContent = {
    alignItems: 'center',
    color: BaseTheme.palette.icon01,
    display: 'flex',
    flex: 1
};

/**
 * The style for the context menu items text.
 */
const contextMenuItemText = {
    ...BaseTheme.typography.bodyShortRegularLarge,
    color: BaseTheme.palette.text01
};

/**
 * The style of the participants pane buttons.
 */
export const button = {
    backgroundColor: BaseTheme.palette.action02,
    borderRadius: BaseTheme.shape.borderRadius,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    minWidth: 0
};

/**
 * Small buttons.
 */
const smallButton = {
    ...button,
    height: BaseTheme.spacing[7],
    width: BaseTheme.spacing[7]
};

/**
 * Mute all button.
 */
const muteAllButton = {
    ...button,
    marginLeft: 'auto'
};

/**
 * The style of the participants pane buttons description.
 */
const buttonContent = {
    ...BaseTheme.typography.labelButton,
    alignContent: 'center',
    color: BaseTheme.palette.text01,
    display: 'flex',
    justifyContent: 'center'
};

/**
 * The style of the context menu pane items.
 */
const contextMenuItem = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    height: BaseTheme.spacing[7],
    marginLeft: BaseTheme.spacing[3]
};

/**
 * The styles of the native components of the feature {@code participants}.
 */
export default {

    participantActionsButtonAdmit: {
        backgroundColor: BaseTheme.palette.action01,
        borderRadius: BaseTheme.shape.borderRadius,
        flexDirection: 'row',
        height: BaseTheme.spacing[6],
        marginRight: BaseTheme.spacing[3],
        position: 'absolute',
        right: 0,
        zIndex: 1
    },

    participantActionsButtonContent: {
        alignItems: 'center',
        display: 'flex',
        height: BaseTheme.spacing[5],
        top: BaseTheme.spacing[1]
    },

    participantActionsButtonText: {
        color: BaseTheme.palette.text01,
        textTransform: 'capitalize'
    },

    admitAllParticipantsActionButtonLabel: {
        ...BaseTheme.typography.heading6,
        color: BaseTheme.palette.link01,
        textTransform: 'capitalize',
        marginRight: BaseTheme.spacing[5],
        marginTop: BaseTheme.spacing[3]
    },

    participantContainer: {
        alignItems: 'center',
        borderBottomColor: BaseTheme.palette.field01Hover,
        borderBottomWidth: 2,
        display: 'flex',
        flexDirection: 'row',
        height: BaseTheme.spacing[9],
        paddingLeft: BaseTheme.spacing[3],
        paddingRight: BaseTheme.spacing[3],
        width: '100%'
    },

    participantContent: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        overflow: 'hidden',
        width: '100%'
    },

    participantDetailsContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '73%'
    },

    participantDetailsContainerRaisedHand: {
        width: '65%'
    },

    participantNameContainer: {
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        paddingLeft: BaseTheme.spacing[3],
        width: '100%'
    },

    participantName: {
        overflow: 'hidden',
        color: BaseTheme.palette.text01
    },

    moderatorLabel: {
        color: BaseTheme.palette.text03,
        alignSelf: 'flex-start',
        paddingLeft: BaseTheme.spacing[3],
        paddingTop: BaseTheme.spacing[1]
    },

    participantStatesContainer: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: 'auto',
        width: '15%'
    },

    participantStateVideo: {
        paddingRight: BaseTheme.spacing[3]
    },

    raisedHandIndicator: {
        backgroundColor: BaseTheme.palette.warning02,
        borderRadius: BaseTheme.shape.borderRadius / 2,
        height: BaseTheme.spacing[4],
        width: BaseTheme.spacing[4],
        marginLeft: 'auto',
        marginRight: BaseTheme.spacing[2]
    },

    raisedHandIcon: {
        ...flexContent,
        top: BaseTheme.spacing[1],
        color: BaseTheme.palette.uiBackground
    },

    lobbyListContent: {
        height: '16%'
    },

    lobbyListDescription: {
        fontSize: 15,
        color: BaseTheme.palette.text01,
        fontWeight: 'bold',
        marginTop: BaseTheme.spacing[2]
    },

    lobbyListDetails: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden',
        position: 'relative',
        width: '100%'
    },

    notLocalModeratorContainer: {
        height: '100%'
    },

    meetingListContainer: {
        height: '58%'
    },

    meetingListFullContainer: {
        height: '82%'
    },

    meetingListDescription: {
        ...participantListDescription,
        marginLeft: BaseTheme.spacing[3]
    },

    collapsibleRoomContainer: {
        height: '30%'
    },

    participantsPaneContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1,
        justifyContent: 'center'
    },

    participantsPaneFooter: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        bottom: 0,
        flexDirection: 'row',
        height: BaseTheme.spacing[12],
        left: 0,
        right: 0,
        position: 'absolute',
        paddingBottom: BaseTheme.spacing[2],
        paddingLeft: BaseTheme.spacing[3],
        paddingRight: BaseTheme.spacing[3]
    },

    headerCloseIcon: {
        marginLeft: 12
    },

    inviteButton: {
        backgroundColor: BaseTheme.palette.action01,
        borderRadius: BaseTheme.shape.borderRadius,
        height: BaseTheme.spacing[7],
        marginLeft: BaseTheme.spacing[3],
        marginRight: BaseTheme.spacing[3],
        marginVertical: BaseTheme.spacing[3]
    },

    inviteLabel: {
        fontSize: 15,
        lineHeight: 30,
        textTransform: 'capitalize'
    },

    moreButton: {
        ...smallButton
    },

    moreIcon: {
        ...buttonContent,
        height: BaseTheme.spacing[5],
        marginLeft: 'auto'
    },

    muteAllButton: {
        ...muteAllButton
    },

    muteAllMoreButton: {
        ...muteAllButton,
        right: BaseTheme.spacing[3]
    },

    muteAllLabel: {
        ...BaseTheme.typography.labelButtonLarge,
        color: BaseTheme.palette.text01,
        height: BaseTheme.spacing[7],
        marginVertical: BaseTheme.spacing[0],
        marginHorizontal: BaseTheme.spacing[0],
        paddingTop: 12,
        paddingBottom: 12,
        textTransform: 'capitalize',
        width: 94
    },

    contextMenuItem: {
        ...contextMenuItem
    },

    contextMenuItemSection: {
        ...contextMenuItem
    },

    contextMenuItemSectionAvatar: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.bottomSheet,
        borderBottomColor: BaseTheme.palette.dividerColor,
        borderBottomWidth: 1,
        borderTopLeftRadius: BaseTheme.spacing[3],
        borderTopRightRadius: BaseTheme.spacing[3],
        flexDirection: 'row',
        height: BaseTheme.spacing[7],
        paddingLeft: BaseTheme.spacing[3]
    },

    contextMenuItemText: {
        ...contextMenuItemText,
        marginLeft: BaseTheme.spacing[3]
    },

    contextMenuItemTextNoIcon: {
        ...contextMenuItemText,
        marginLeft: BaseTheme.spacing[6]
    },

    contextMenuItemName: {
        color: BaseTheme.palette.text04,
        flexShrink: 1,
        fontSize: BaseTheme.spacing[3],
        marginLeft: BaseTheme.spacing[3],
        opacity: 0.90
    },

    divider: {
        backgroundColor: BaseTheme.palette.dividerColor
    },

    clearableInput: {
        display: 'flex',
        height: MD_ITEM_HEIGHT,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: BaseTheme.palette.border02,
        backgroundColor: BaseTheme.palette.uiBackground,
        borderRadius: BaseTheme.shape.borderRadius,
        marginLeft: BaseTheme.spacing[3],
        marginRight: BaseTheme.spacing[3],
        marginBottom: BaseTheme.spacing[4]
    },

    clearableInputFocus: {
        borderWidth: 3,
        borderColor: BaseTheme.palette.field01Focus
    },

    clearButton: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        paddingTop: 12,
        paddingLeft: BaseTheme.spacing[2],
        width: 40,
        height: MD_ITEM_HEIGHT
    },

    clearIcon: {
        color: BaseTheme.palette.icon02
    },

    clearableInputTextInput: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        height: '100%',
        width: '100%',
        textAlign: 'center',
        color: BaseTheme.palette.text01,
        paddingTop: BaseTheme.spacing[2],
        paddingBottom: BaseTheme.spacing[2],
        paddingLeft: BaseTheme.spacing[3],
        paddingRight: BaseTheme.spacing[3],
        fontSize: 16
    }
};
