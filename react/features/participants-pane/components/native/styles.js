import BaseTheme from '../../../base/ui/components/BaseTheme.native';

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
    ...BaseTheme.typography.labelButtonLarge,
    color: BaseTheme.palette.text01,
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
        display: 'flex',
        flexDirection: 'row',
        fontSize: 13,
        height: 64,
        justifyContent: 'center',
        margin: BaseTheme.spacing[4],
        paddingLeft: 8,
        paddingRight: 8
    },

    participantContent: {
        backgroundColor: 'green',
        boxShadow: BaseTheme.shape.boxShadow,
        overflow: 'hidden',
        paddingRight: BaseTheme.spacing[4],
        width: '100%'
    },

    participantNameContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'row',
        marginRight: BaseTheme.spacing[3],
        overflow: 'hidden'
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

    participantStates: {
        alignItems: 'flex-end',
        display: 'flex'
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
