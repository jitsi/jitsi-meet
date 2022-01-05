// @flow

import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

/**
 * The styles of the feature security.
 */
export default {

    securityDialogContainer: {
        flex: 1,
        marginTop: BaseTheme.spacing[4]
    },

    headerCloseButton: {
        marginLeft: 12
    },

    lobbyModeContainer: {
        borderBottomColor: BaseTheme.palette.border01,
        borderBottomWidth: 1
    },

    lobbyModeContent: {
        marginHorizontal: BaseTheme.spacing[3],
        marginBottom: BaseTheme.spacing[4]
    },

    lobbyModeLabel: {
        fontWeight: 'bold',
        marginTop: BaseTheme.spacing[2]
    },

    lobbyModeSection: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: BaseTheme.spacing[1]
    },

    passwordContainer: {
        marginHorizontal: BaseTheme.spacing[3],
        marginTop: BaseTheme.spacing[4]
    },

    passwordContainerControls: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    savedPasswordContainer: {
        flexDirection: 'row',
        marginTop: 20,
        width: 208
    },

    savedPasswordLabel: {
        fontWeight: 'bold'
    },

    savedPassword: {
        color: BaseTheme.palette.text06
    },

    passwordInput: {
        borderColor: BaseTheme.palette.action03Active,
        borderRadius: BaseTheme.spacing[1],
        borderWidth: 2,
        height: BaseTheme.spacing[6],
        marginTop: BaseTheme.spacing[2],
        paddingLeft: BaseTheme.spacing[1],
        width: 208
    },

    passwordSetupButton: {
        ...BaseTheme.typography.heading7,
        color: BaseTheme.palette.screen01Header,
        marginTop: BaseTheme.spacing[4],
        textTransform: 'uppercase'
    },

    passwordSetRemotelyContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    passwordSetRemotelyText: {
        color: BaseTheme.palette.text06,
        marginTop: 22
    },

    passwordSetRemotelyTextDisabled: {
        color: BaseTheme.palette.text03,
        marginTop: 22
    }
};
