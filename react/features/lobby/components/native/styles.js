// @flow

import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const SECONDARY_COLOR = BaseTheme.palette.border04;

const lobbyText = {
    ...BaseTheme.typography.heading5,
    color: BaseTheme.palette.text01,
    textAlign: 'center'
};

export default {

    buttonStylesBorderless: {
        iconStyle: {
            color: BaseTheme.palette.icon01,
            fontSize: 24
        },
        style: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginHorizontal: BaseTheme.spacing[3],
            height: 24,
            width: 24
        },
        underlayColor: 'transparent'
    },

    lobbyChatWrapper: {
        backgroundColor: BaseTheme.palette.ui01,
        alignItems: 'stretch',
        flexDirection: 'column',
        justifyItems: 'center',
        height: '100%'
    },

    lobbyChatHeader: {
        flexDirection: 'row',
        padding: 20
    },

    lobbyChatTitle: {
        color: BaseTheme.palette.text01,
        fontSize: 20,
        fontWeight: 'bold',
        flexShrink: 1
    },

    lobbyChatCloseButton: {
        fontSize: 24,
        marginLeft: BaseTheme.spacing[3],
        marginTop: BaseTheme.spacing[1],
        color: BaseTheme.palette.icon01
    },

    contentWrapper: {
        flex: 1
    },

    contentWrapperWide: {
        flex: 1,
        flexDirection: 'row'
    },

    largeVideoContainer: {
        minHeight: '50%'
    },

    largeVideoContainerWide: {
        height: '100%',
        marginRight: 'auto',
        position: 'absolute',
        width: '50%'
    },

    contentContainer: {
        alignSelf: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '50%',
        paddingHorizontal: BaseTheme.spacing[3],
        width: 400
    },

    contentContainerWide: {
        alignItems: 'center',
        height: '100%',
        justifyContent: 'center',
        left: '50%',
        paddingHorizontal: BaseTheme.spacing[3],
        position: 'absolute',
        width: '50%'
    },

    toolboxContainer: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: BaseTheme.spacing[3]
    },

    toolboxContainerWide: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: BaseTheme.spacing[3]
    },

    displayNameText: {
        fontWeight: 'bold',
        marginVertical: 10
    },

    editButton: {
        alignSelf: 'flex-end',
        paddingHorizontal: 10
    },

    editIcon: {
        color: 'black',
        fontSize: 16
    },

    formWrapper: {
        alignSelf: 'stretch',
        justifyContent: 'center'
    },

    field: {
        alignSelf: 'stretch',
        backgroundColor: BaseTheme.palette.field02,
        borderColor: SECONDARY_COLOR,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 2,
        color: BaseTheme.palette.text06,
        height: BaseTheme.spacing[7],
        marginTop: 38,
        marginHorizontal: BaseTheme.spacing[3],
        padding: BaseTheme.spacing[2],
        textAlign: 'center'
    },

    fieldError: {
        color: BaseTheme.palette.warning03,
        marginLeft: BaseTheme.spacing[3],
        fontSize: 16
    },

    fieldLabel: {
        ...BaseTheme.typography.heading6,
        color: BaseTheme.palette.text01,
        textAlign: 'center'
    },

    standardButtonWrapper: {
        alignSelf: 'stretch'
    },

    joiningMessage: {
        color: BaseTheme.palette.text01,
        marginHorizontal: BaseTheme.spacing[3],
        textAlign: 'center'
    },

    passwordJoinButtonsWrapper: {
        alignItems: 'stretch',
        alignSelf: 'stretch',
        marginHorizontal: BaseTheme.spacing[3]
    },

    loadingIndicator: {
        marginBottom: BaseTheme.spacing[3]
    },

    participantBox: {
        alignItems: 'center',
        alignSelf: 'stretch',
        borderColor: SECONDARY_COLOR,
        borderRadius: 4,
        borderWidth: 1,
        marginVertical: 18,
        paddingVertical: 12
    },

    lobbyButton: {
        marginTop: BaseTheme.spacing[3]
    },

    openChatButton: {
        marginHorizontal: BaseTheme.spacing[3],
        marginTop: BaseTheme.spacing[3]
    },

    enterPasswordButton: {
        marginHorizontal: BaseTheme.spacing[3],
        marginTop: BaseTheme.spacing[3]
    },

    // KnockingParticipantList

    knockingParticipantList: {
        alignSelf: 'stretch',
        backgroundColor: 'rgba(22, 38, 55, 0.8)',
        flexDirection: 'column'
    },

    knockingParticipantListButton: {
        borderRadius: 4,
        marginHorizontal: 3,
        paddingHorizontal: 10,
        paddingVertical: 5
    },

    knockingParticipantListDetails: {
        flex: 1,
        marginLeft: 10
    },

    knockingParticipantListEntry: {
        alignItems: 'center',
        flexDirection: 'row',
        padding: 10
    },

    knockingParticipantListPrimaryButton: {
        backgroundColor: 'rgb(3, 118, 218)'
    },

    knockingParticipantListSecondaryButton: {
        backgroundColor: 'transparent'
    },

    knockingParticipantListText: {
        color: 'white'
    },

    lobbyTitle: {
        ...lobbyText
    },

    lobbyRoomName: {
        ...lobbyText,
        marginBottom: BaseTheme.spacing[2]
    }
};
