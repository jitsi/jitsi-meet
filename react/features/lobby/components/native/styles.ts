import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default {

    lobbyChatWrapper: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    passwordJoinButtons: {
        top: 40
    },

    contentContainer: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
        bottom: 0,
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

    // KnockingParticipantList

    knockingParticipantList: {
        backgroundColor: BaseTheme.palette.ui01
    },


    knockingParticipantListDetails: {
        flex: 1,
        marginLeft: BaseTheme.spacing[2]
    },

    knockingParticipantListEntry: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        flexDirection: 'row'
    },

    knockingParticipantListText: {
        color: 'white'
    },

    lobbyButtonAdmit: {
        position: 'absolute',
        right: 184,
        top: 6
    },

    lobbyButtonChat: {
        position: 'absolute',
        right: 104,
        top: 6
    },

    lobbyButtonReject: {
        position: 'absolute',
        right: 16,
        top: 6
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
