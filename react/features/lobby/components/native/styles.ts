import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default {

    lobbyChatWrapper: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    passwordJoinButtons: {
        top: BaseTheme.spacing[7]
    },

    contentContainer: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
        bottom: BaseTheme.spacing[0],
        display: 'flex',
        height: 388,
        justifyContent: 'center',
        position: 'absolute',
        width: '100%',
        zIndex: 1
    },

    formWrapper: {
        alignItems: 'center',
        justifyContent: 'center'
    },

    customInput: {
        position: 'relative',
        textAlign: 'center',
        top: BaseTheme.spacing[6],
        width: 352
    },

    joiningMessage: {
        color: BaseTheme.palette.text01,
        marginHorizontal: BaseTheme.spacing[3],
        textAlign: 'center'
    },

    loadingIndicator: {
        marginBottom: BaseTheme.spacing[3]
    },

    lobbyTitle: {
        ...BaseTheme.typography.heading5,
        color: BaseTheme.palette.text01,
        marginBottom: BaseTheme.spacing[3],
        textAlign: 'center'
    },

    lobbyWaitingFragmentContainer: {
        height: 260
    }
};
