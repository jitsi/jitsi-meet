// @flow

import BaseTheme from '../../../base/ui/components/BaseTheme';

const SECONDARY_COLOR = BaseTheme.palette.border04;

export const ENABLED_THUMB_COLOR = BaseTheme.palette.action04;
export const ENABLED_TRACK_COLOR = BaseTheme.palette.screen01Header;
export const DISABLED_THUMB_COLOR = BaseTheme.palette.icon04;

export default {
    button: {
        alignItems: 'center',
        borderRadius: 4,
        marginVertical: 4,
        paddingVertical: 8
    },

    contentWrapper: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyItems: 'center',
        height: '100%'
    },

    closeIcon: {
        color: 'red',
        fontSize: 20
    },

    dialogTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        margin: 'auto',
        marginVertical: 24,
        textAlign: 'center'
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
        color: BaseTheme.palette.warning07,
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
        color: 'rgba(0, 0, 0, .7)',
        paddingBottom: 36,
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
        color: 'rgba(0, 0, 0, .7)',
        margin: 'auto',
        textAlign: 'center'
    },

    cancelButton: {
        alignItems: 'center',
        backgroundColor: 'transparent',
        marginVertical: 4
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
