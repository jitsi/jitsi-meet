import BaseTheme from '../../../base/ui/components/BaseTheme.native';

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
    height: 64,
    justifyContent: 'center',
    paddingRight: 8,
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
    ...BaseTheme.typography.labelButtonLarge,
    ...flexContent,
    justifyContent: 'center'
};

/**
 * The styles of the native components of the feature {@code participants}.
 */
export default {

    participantActionButton: {
        backgroundColor: BaseTheme.palette.action01,
        borderRadius: BaseTheme.shape.borderRadius,
        height: 40,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 16,
        paddingRight: 16,
        width: 73
    },

    participantContainer: {
        alignItems: 'center',
        color: BaseTheme.palette.text01,
        display: 'flex',
        fontSize: 13,
        height: 64,
        margin: BaseTheme.spacing[4],
        position: 'relative',
        width: 375
    },

    participantContent: {
        ...flexContent,
        boxShadow: BaseTheme.shape.boxShadow,
        height: '100%',
        overflow: 'hidden',
        paddingRight: BaseTheme.spacing[4]
    },

    participantNameContainer: {
        display: 'flex',
        flex: 1,
        marginRight: BaseTheme.spacing[3],
        overflow: 'hidden'
    },

    participantName: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },

    participantsPane: {
        backgroundColor: BaseTheme.palette.ui01
    },

    participantStates: {
        display: 'flex',
        justifyContent: 'flex-end'
    },

    raisedHandIndicator: {
        backgroundColor: BaseTheme.palette.warning02,
        borderRadius: BaseTheme.shape.borderRadius / 2,
        height: 24,
        width: 24
    },

    lobbyListContainer: {
        ...container
    },

    header: {
        ...container,
        backgroundColor: 'red'
    },

    footer: {
        ...container,
        backgroundColor: 'green',
        marginTop: 'auto'
    },

    closeButton: {
        ...smallButton
    },

    closeIcon: {
        ...buttonContent
    },

    moreButton: {
        ...smallButton
    },

    moreIcon: {
        ...buttonContent
    },

    moreButtonPaper: {
        ...smallButton,
        height: 48
    },

    moreIconPaper: {
        alignItems: 'center',
        flexDirection: 'row-reverse'
    },

    muteAllButton: {
        ...button,
        paddingBottom: 12,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 12,
        width: 94
    },

    muteAllContent: {
        ...buttonContent
    }
};
