import BaseTheme from '../../../base/ui/components/BaseTheme.native';

/**
 * The style for participant states.
 */
const participantState = {
    display: 'flex',
    justifyContent: 'center'
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
const button = {
    alignItems: 'center',
    backgroundColor: BaseTheme.palette.action02,
    borderRadius: BaseTheme.shape.borderRadius,
    display: 'flex',
    height: 48,
    justifyContent: 'center',
    marginLeft: 'auto'
};

/**
 * Small buttons.
 */
const smallButton = {
    ...button,
    width: 48
};

/**
 * The style of the participants pane buttons description.
 */
const buttonContent = {
    ...BaseTheme.typography.labelButton,
    ...flexContent,
    color: BaseTheme.palette.text01,
    justifyContent: 'center'
};

/**
 * The styles of the native components of the feature {@code participants}.
 */
export default {

    lobbyParticipantItem: {
        flexDirection: 'row',
        position: 'absolute',
        right: 0,
        zIndex: 1
    },

    participantActionsHover: {
        backgroundColor: '#292929',
        bottom: 1,
        display: 'none',
        position: 'absolute',
        right: 8,
        top: 0,
        zIndex: 1,
        after: {
            backgroundColor: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, #292929 100%)',
            content: '',
            bottom: 0,
            display: 'block',
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            transform: 'translateX(-100%)',
            width: 40
        }
    },

    participantActionsPermanent: {
        display: 'flex',
        zIndex: 1
    },

    participantActionsButtonAdmit: {
        backgroundColor: BaseTheme.palette.action01,
        borderRadius: BaseTheme.shape.borderRadius,
        height: 32
    },

    participantActionsButtonReject: {
        backgroundColor: BaseTheme.palette.action01,
        borderRadius: BaseTheme.shape.borderRadius,
        height: 32
    },

    participantActionsButtonContent: {
        alignItems: 'center',
        display: 'flex',
        height: 32
    },

    participantActionsButtonText: {
        color: BaseTheme.palette.text01,
        textTransform: 'capitalize'
    },

    allParticipantActionsButton: {
        ...BaseTheme.typography.labelRegular,
        color: BaseTheme.palette.action01,
        textTransform: 'capitalize'

    },

    participantContainer: {
        alignItems: 'center',
        borderBottomColor: BaseTheme.palette.field01Hover,
        borderBottomWidth: 2,
        display: 'flex',
        flexDirection: 'row',
        height: 64,
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
        marginLeft: BaseTheme.spacing[2],
        overflow: 'hidden',
        width: '63%'
    },

    participantName: {
        overflow: 'hidden',
        color: BaseTheme.palette.text01
    },

    isLocal: {
        color: BaseTheme.palette.text01
    },

    participantsPane: {
        backgroundColor: BaseTheme.palette.ui01
    },

    participantStatesContainer: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: 16
    },

    participantStateAudio: {
        ...participantState
    },

    participantStateVideo: {
        ...participantState,
        marginRight: 8
    },

    raisedHandIndicator: {
        backgroundColor: BaseTheme.palette.warning02,
        borderRadius: BaseTheme.shape.borderRadius / 2,
        height: 24,
        marginRight: 8,
        width: 24
    },

    raisedHandIcon: {
        ...flexContent,
        top: 4
    },
    lobbyList: {
        marginLeft: 16,
        marginRight: 16,
        position: 'relative'
    },

    lobbyListDetails: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        paddingBottom: 16,
        paddingTop: 16,
        position: 'relative',
        width: '100%'
    },

    lobbyListDescription: {
        color: BaseTheme.palette.text01,
        paddingBottom: 8,
        paddingTop: 8,
        position: 'relative',
        width: '55%'
    },

    lobbyListActions: {
        flexDirection: 'row',
        left: 0
    },

    header: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        top: 0,
        display: 'flex',
        flexDirection: 'row',
        height: 88,
        paddingRight: 16,
        position: 'absolute',
        right: 0,
        left: 0
    },

    footer: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        bottom: 0,
        display: 'flex',
        flexDirection: 'row',
        height: 88,
        paddingRight: 16,
        position: 'absolute',
        right: 0,
        left: 0
    },

    closeButton: {
        ...smallButton
    },

    closeIcon: {
        ...buttonContent,
        left: 8
    },

    moreButton: {
        ...smallButton
    },

    inviteButton: {
        backgroundColor: BaseTheme.palette.action01
    },

    inviteLabel: {
        ...BaseTheme.typography.labelButtonLarge,
        textTransform: 'capitalize'
    },

    moreIcon: {
        ...buttonContent,
        left: 8
    },

    muteAllButton: {
        ...button,
        left: 80
    },

    muteAllLabel: {
        color: BaseTheme.palette.text01,
        textTransform: 'capitalize'
    }
};
