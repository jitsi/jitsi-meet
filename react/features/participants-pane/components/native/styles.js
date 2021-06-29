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
 * The style of the participants pane buttons.
 */
export const button = {
    alignItems: 'center',
    backgroundColor: BaseTheme.palette.action02,
    borderRadius: BaseTheme.shape.borderRadius,
    display: 'flex',
    justifyContent: 'center',
    marginLeft: 'auto'
};

/**
 * Small buttons.
 */
const smallButton = {
    ...button
};

/**
 * The style of the participants pane buttons description.
 */
const buttonContent = {
    ...BaseTheme.typography.labelButton,
    color: BaseTheme.palette.text01,
    justifyContent: 'center'
};

/**
 * The style of the context menu pane items.
 */
const contextMenuItem = {
    flexDirection: 'row',
    paddingBottom: 16,
    paddingTop: 16
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
        textTransform: 'capitalize'
    },

    admitAllParticipantsActionButton: {
        marginLeft: 'auto'
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

    participantNameContainer: {
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        paddingLeft: BaseTheme.spacing[2],
        width: '63%'
    },

    participantName: {
        overflow: 'hidden',
        color: BaseTheme.palette.text01
    },

    isLocal: {
        alignSelf: 'center',
        color: BaseTheme.palette.text01,
        marginLeft: 4
    },

    participantsPane: {
        backgroundColor: BaseTheme.palette.ui01
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
        marginLeft: BaseTheme.spacing[1],
        width: BaseTheme.spacing[4]
    },

    raisedHandIcon: {
        ...flexContent,
        top: BaseTheme.spacing[1]
    },
    lobbyList: {
        position: 'relative'
    },

    meetingList: {
        position: 'relative',
        marginTop: BaseTheme.spacing[3]
    },

    lobbyListDetails: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden',
        paddingLeft: BaseTheme.spacing[3],
        position: 'relative',
        width: '100%'
    },

    lobbyListDescription: {
        ...participantListDescription
    },

    meetingListDescription: {
        ...participantListDescription,
        marginLeft: BaseTheme.spacing[3]
    },

    header: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        top: BaseTheme.spacing[0],
        display: 'flex',
        flexDirection: 'row',
        height: BaseTheme.spacing[10],
        paddingRight: BaseTheme.spacing[3],
        position: 'relative',
        right: BaseTheme.spacing[0],
        left: BaseTheme.spacing[0]
    },

    footer: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        bottom: BaseTheme.spacing[0],
        display: 'flex',
        flexDirection: 'row',
        height: BaseTheme.spacing[10],
        paddingRight: BaseTheme.spacing[3],
        position: 'relative',
        right: BaseTheme.spacing[0],
        left: BaseTheme.spacing[0]
    },

    closeButton: {
        ...smallButton,
        width: BaseTheme.spacing[8]
    },

    closeIcon: {
        ...buttonContent,
        height: BaseTheme.spacing[8],
        left: BaseTheme.spacing[2]
    },

    inviteButton: {
        backgroundColor: BaseTheme.palette.action01,
        marginTop: BaseTheme.spacing[2],
        marginLeft: BaseTheme.spacing[3],
        marginRight: BaseTheme.spacing[3]
    },

    inviteLabel: {
        ...BaseTheme.typography.labelButtonLarge,
        textTransform: 'capitalize'
    },

    moreButton: {
        ...smallButton,
        width: BaseTheme.spacing[8]
    },

    moreIcon: {
        ...buttonContent,
        height: BaseTheme.spacing[8],
        left: BaseTheme.spacing[2]
    },

    contextMenuMore: {
        backgroundColor: BaseTheme.palette.action02,
        borderRadius: BaseTheme.shape.borderRadius
    },

    muteAllButton: {
        ...button,
        left: BaseTheme.spacing[10] + BaseTheme.spacing[2]
    },

    muteAllContent: {
        ...buttonContent,
        height: BaseTheme.spacing[8]
    },

    muteAllLabel: {
        ...BaseTheme.typography.labelButtonLarge,
        color: BaseTheme.palette.text01,
        textTransform: 'capitalize'
    },

    contextMenuItem: {
        ...contextMenuItem
    },

    contextMenuItemSection: {
        ...contextMenuItem
    },

    contextMenuItemText: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        color: BaseTheme.palette.text01,
        marginLeft: BaseTheme.spacing[3]
    },

    contextMenuItemIcon: {
        marginLeft: BaseTheme.spacing[1]
    },

    contextMenuItemName: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        color: BaseTheme.palette.text01
    },

    contextMenuIcon: {
        color: BaseTheme.palette.actionDanger
    },

    divider: {
        backgroundColor: BaseTheme.palette.section01
    }
};
