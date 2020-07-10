// @flow

import { ColorPalette } from '../../../base/styles';

const SECONDARY_COLOR = '#B8C7E0';

export default {
    button: {
        alignItems: 'center',
        borderRadius: 4,
        marginVertical: 8,
        paddingVertical: 10
    },

    contentWrapper: {
        alignItems: 'center',
        flexDirection: 'column',
        padding: 32
    },

    dialogTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
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

    field: {
        borderColor: SECONDARY_COLOR,
        borderRadius: 4,
        borderWidth: 1,
        marginVertical: 8,
        padding: 8
    },

    fieldError: {
        color: ColorPalette.warning,
        fontSize: 10
    },

    fieldRow: {
        paddingTop: 16
    },

    fieldLabel: {
        textAlign: 'center'
    },

    formWrapper: {
        alignItems: 'stretch',
        alignSelf: 'stretch',
        paddingVertical: 16
    },

    joiningMessage: {
        textAlign: 'center'
    },

    loadingIndicator: {
        marginVertical: 36
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
        alignSelf: 'stretch',
        backgroundColor: 'rgb(3, 118, 218)'
    },

    primaryButtonText: {
        color: 'white'
    },

    secondaryButton: {
        alignSelf: 'stretch',
        backgroundColor: 'transparent'
    },

    secondaryText: {
        color: 'rgba(0, 0, 0, .7)'
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
    }
};
