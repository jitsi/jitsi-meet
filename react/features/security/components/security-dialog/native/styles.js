// @flow

import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

/**
 * The styles of the feature security.
 */
export default {

    securityDialogContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    headerCloseButton: {
        marginLeft: 12
    },

    lobbyModeContainer: {
        borderBottomColor: BaseTheme.palette.border01,
        borderBottomWidth: 1,
        marginTop: BaseTheme.spacing[4]
    },

    lobbyModeContent: {
        marginHorizontal: BaseTheme.spacing[3],
        marginBottom: BaseTheme.spacing[4]
    },

    lobbyModeText: {
        color: BaseTheme.palette.text01
    },

    lobbyModeLabel: {
        color: BaseTheme.palette.text01,
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

    passwordContainerText: {
        color: BaseTheme.palette.text01
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
        color: BaseTheme.palette.text01,
        fontWeight: 'bold'
    },

    savedPassword: {
        color: BaseTheme.palette.text01
    },

    passwordInput: {
        borderColor: BaseTheme.palette.action03Active,
        borderRadius: BaseTheme.spacing[1],
        borderWidth: 2,
        color: BaseTheme.palette.text01,
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
        color: BaseTheme.palette.text01,
        marginTop: 22
    },

    passwordSetRemotelyTextDisabled: {
        color: BaseTheme.palette.text02,
        marginTop: 22
    }
};
