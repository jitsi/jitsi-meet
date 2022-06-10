// @flow

import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const SECONDARY_COLOR = BaseTheme.palette.border04;

export default {
    button: {
        alignItems: 'center',
        borderRadius: BaseTheme.shape.borderRadius,
        padding: BaseTheme.spacing[2],
        height: BaseTheme.spacing[7],
        width: '100%'
    },

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
        }
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
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '50%'
    },

    contentContainerWide: {
        height: '100%',
        justifyContent: 'center',
        left: '50%',
        marginHorizontal: BaseTheme.spacing[6],
        marginVertical: BaseTheme.spacing[3],
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
        height: BaseTheme.spacing[7],
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
        alignSelf: 'stretch',
        marginHorizontal: 12
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
        marginBottom: BaseTheme.spacing[4]
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

    primaryButton: {
        backgroundColor: BaseTheme.palette.action01,
        marginTop: BaseTheme.spacing[4]
    },

    primaryButtonDisabled: {
        backgroundColor: BaseTheme.palette.action03Disabled,
        marginTop: BaseTheme.spacing[4]
    },

    primaryButtonText: {
        ...BaseTheme.typography.labelButtonLarge,
        color: BaseTheme.palette.text01,
        lineHeight: 30
    },

    primaryText: {
        color: BaseTheme.palette.text01,
        margin: 'auto',
        textAlign: 'center'
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

    lobbySwitchContainer: {
        flexDirection: 'column',
        marginTop: BaseTheme.spacing[2]
    },

    lobbySwitchIcon: {
        alignSelf: 'flex-end'
    }
};
