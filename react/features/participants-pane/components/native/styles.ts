import BaseTheme from '../../../base/ui/components/BaseTheme.native';

/**
 * The style for participant list description.
 */
const participantListDescription = {
    ...BaseTheme.typography.heading6,
    color: BaseTheme.palette.text01,
    marginLeft: BaseTheme.spacing[2],
    paddingVertical: BaseTheme.spacing[2]
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
    display: 'flex',
    flexDirection: 'row',
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

    participantsBadge: {
        backgroundColor: BaseTheme.palette.ui03,
        borderRadius: BaseTheme.spacing[2],
        borderColor: 'white',
        overflow: 'hidden',
        height: BaseTheme.spacing[3],
        minWidth: BaseTheme.spacing[3],
        color: BaseTheme.palette.text01,
        ...BaseTheme.typography.labelBold,
        position: 'absolute',
        right: -3,
        top: -3,
        textAlign: 'center',
        paddingHorizontal: 2
    },

    participantsButtonBadge: {
        display: 'flex',
        position: 'relative'
    },

    participantContainer: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        height: BaseTheme.spacing[9],
        paddingLeft: BaseTheme.spacing[3],
        paddingRight: BaseTheme.spacing[3]
    },

    participantContent: {
        alignItems: 'center',
        borderBottomColor: BaseTheme.palette.ui02,
        borderBottomWidth: 2.4,
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
        paddingLeft: BaseTheme.spacing[3],
    },

    participantName: {
        color: BaseTheme.palette.text01,
        overflow: 'hidden'
    },

    moderatorLabel: {
        color: BaseTheme.palette.text03,
        alignSelf: 'flex-start',
        paddingLeft: BaseTheme.spacing[3],
        paddingTop: BaseTheme.spacing[1]
    },

    participantStatesContainer: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        marginLeft: 'auto'
    },

    participantStateVideo: {
        marginRight: BaseTheme.spacing[2]
    },

    raisedHandIndicator: {
        backgroundColor: BaseTheme.palette.warning02,
        borderRadius: BaseTheme.shape.borderRadius,
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

    buttonAdmit: {
        position: 'absolute',
        right: BaseTheme.spacing[3]
    },

    buttonReject: {
        position: 'absolute',
        right: 112
    },

    lobbyListDescription: {
        ...participantListDescription
    },

    listDetails: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    meetingListContainer: {
        paddingHorizontal: BaseTheme.spacing[3]
    },

    meetingListDescription: {
        ...participantListDescription
    },

    participantsPaneContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1,
        flexDirection: 'column',
        paddingVertical: BaseTheme.spacing[2]
    },

    participantsPaneFooterContainer: {
        alignSelf: 'stretch',
        marginHorizontal: BaseTheme.spacing[5]
    },

    participantsPaneFooter: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: 'auto'
    },

    inviteButton: {
        marginLeft: BaseTheme.spacing[3],
        marginRight: BaseTheme.spacing[3],
        marginVertical: BaseTheme.spacing[2]
    },

    breakoutRoomsButton: {
        marginBottom: BaseTheme.spacing[2],
        width: '100%'
    },

    moreButton: {
        marginLeft: BaseTheme.spacing[2]
    },

    contextMenuItem: {
        ...contextMenuItem
    },

    contextMenuItemSection: {
        ...contextMenuItem
    },

    contextMenuItemSectionAvatar: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        borderBottomColor: BaseTheme.palette.ui07,
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
        backgroundColor: BaseTheme.palette.ui07
    },

    inputContainer: {
        marginHorizontal: BaseTheme.spacing[3],
        marginBottom: BaseTheme.spacing[3]
    },

    centerInput: {
        textAlign: 'center'
    },

    visitorsLabel: {
        ...BaseTheme.typography.heading6,
        color: BaseTheme.palette.warning02,
        marginLeft: BaseTheme.spacing[2]
    }
};
