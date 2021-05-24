import BaseTheme from '../../../base/ui/components/BaseTheme.native';


/**
 * The style for participant actions.
 */
const participantActions = {
    alignItems: 'center',
    zIndex: 1
};

/**
 * The style for participant states.
 */
const participantState = {
    alignItems: 'center',
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
const container = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    height: 72,
    paddingRight: 16,
    width: '100%'
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

    participantActions: {
        ...participantActions
    },

    participantActionsHover: {
        ...participantActions,
        backgroundColor: '#292929',
        bottom: 1,
        display: 'none',
        position: 'absolute',
        right: 8,
        top: 0,
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
        ...participantActions,
        display: 'flex'
    },

    participantActionButton: {
        backgroundColor: BaseTheme.palette.action01,
        borderRadius: BaseTheme.shape.borderRadius
    },

    participantActionButtonText: {
        ...BaseTheme.typography.labelRegular
    },

    allParticipantActionButton: {
        ...BaseTheme.typography.labelRegular,
        color: BaseTheme.palette.action01
    },

    participantContainer: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        marginRight: BaseTheme.spacing[6],
        paddingLeft: 8,
        paddingRight: 8
    },

    participantContent: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        height: 64,
        overflow: 'hidden',
        paddingLeft: BaseTheme.spacing[2],
        paddingTop: BaseTheme.spacing[4],
        width: '100%'
    },

    participantNameContainer: {
        display: 'flex',
        flexDirection: 'row',
        marginRight: BaseTheme.spacing[3],
        overflow: 'hidden',
        width: '50%'
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
        justifyItems: 'space-between',
        marginLeft: 'auto'
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

    lobbyListDescription: {
        color: BaseTheme.palette.text01,
        overflow: 'hidden',
        padding: BaseTheme.spacing[2]
    },

    lobbyListContainer: {
        ...container
    },

    lobbyListActions: {
        flexDirection: 'row',
        marginLeft: 'auto'
    },

    header: {
        ...container
    },

    footer: {
        ...container,
        marginTop: 'auto'
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

    moreIcon: {
        ...buttonContent,
        left: 8
    },

    muteAllButton: {
        ...button,
        left: 80
    },

    muteAllContent: {
        ...buttonContent
    }
};
