/* @flow */

import React, { Component } from 'react';
import { Text, TextInput, View } from 'react-native';
import { connect as reduxConnect } from 'react-redux';
import type { Dispatch } from 'redux';

import { ColorSchemeRegistry } from '../../base/color-scheme';
import { toJid } from '../../base/connection';
import { connect } from '../../base/connection/actions.native';
import {
    CustomSubmitDialog,
    FIELD_UNDERLINE,
    PLACEHOLDER_COLOR,
    _abstractMapStateToProps,
    inputDialog as inputDialogStyle
} from '../../base/dialog';
import { translate } from '../../base/i18n';
import { JitsiConnectionErrors } from '../../base/lib-jitsi-meet';
import type { StyleType } from '../../base/styles';

import { authenticateAndUpgradeRole, cancelLogin } from '../actions';

// Register styles.
import './styles';

/**
 * The type of the React {@link Component} props of {@link LoginDialog}.
 */
type Props = {

    /**
     * {@link JitsiConference} that needs authentication - will hold a valid
     * value in XMPP login + guest access mode.
     */
    _conference: Object,

    /**
     * The server hosts specified in the global config.
     */
    _configHosts: Object,

    /**
     * Indicates if the dialog should display "connecting" status message.
     */
    _connecting: boolean,

    /**
     * The color-schemed stylesheet of the base/dialog feature.
     */
    _dialogStyles: StyleType,

    /**
     * The error which occurred during login/authentication.
     */
    _error: Object,

    /**
     * The progress in the floating range between 0 and 1 of the authenticating
     * and upgrading the role of the local participant/user.
     */
    _progress: number,

    /**
     * The color-schemed stylesheet of this feature.
     */
    _styles: StyleType,

    /**
     * Redux store dispatch method.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@link Component} state of {@link LoginDialog}.
 */
type State = {

    /**
     * The user entered password for the conference.
     */
    password: string,

    /**
     * The user entered local participant name.
     */
    username: string
};

/**
 * Dialog asks user for username and password.
 *
 * First authentication configuration that it will deal with is the main XMPP
 * domain (config.hosts.domain) with password authentication. A LoginDialog
 * will be opened after 'CONNECTION_FAILED' action with
 * 'JitsiConnectionErrors.PASSWORD_REQUIRED' error. After username and password
 * are entered a new 'connect' action from 'features/base/connection' will be
 * triggered which will result in new XMPP connection. The conference will start
 * if the credentials are correct.
 *
 * The second setup is the main XMPP domain with password plus guest domain with
 * anonymous access configured under 'config.hosts.anonymousdomain'. In such
 * case user connects from the anonymous domain, but if the room does not exist
 * yet, Jicofo will not allow to start new conference. This will trigger
 * 'CONFERENCE_FAILED' action with JitsiConferenceErrors.AUTHENTICATION_REQUIRED
 * error and 'authRequired' value of 'features/base/conference' will hold
 * the {@link JitsiConference} instance. If user decides to authenticate, a
 * new/separate XMPP connection is established and authentication is performed.
 * In case it succeeds, Jicofo will assign new session ID which then can be used
 * from the anonymous domain connection to create and join the room. This part
 * is done by {@link JitsiConference#authenticateAndUpgradeRole} in
 * lib-jitsi-meet.
 *
 * See {@link https://github.com/jitsi/jicofo#secure-domain} for a description
 * of the configuration parameters.
 */
class LoginDialog extends Component<Props, State> {
    /**
     * Initializes a new LoginDialog instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            username: '',
            password: ''
        };

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onLogin = this._onLogin.bind(this);
        this._onPasswordChange = this._onPasswordChange.bind(this);
        this._onUsernameChange = this._onUsernameChange.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _connecting: connecting,
            _dialogStyles,
            _styles: styles,
            t
        } = this.props;

        return (
            <CustomSubmitDialog
                okDisabled = { connecting }
                onCancel = { this._onCancel }
                onSubmit = { this._onLogin }>
                <View style = { styles.loginDialog }>
                    <TextInput
                        autoCapitalize = { 'none' }
                        autoCorrect = { false }
                        onChangeText = { this._onUsernameChange }
                        placeholder = { 'user@domain.com' }
                        placeholderTextColor = { PLACEHOLDER_COLOR }
                        style = { _dialogStyles.field }
                        underlineColorAndroid = { FIELD_UNDERLINE }
                        value = { this.state.username } />
                    <TextInput
                        onChangeText = { this._onPasswordChange }
                        placeholder = { t('dialog.userPassword') }
                        placeholderTextColor = { PLACEHOLDER_COLOR }
                        secureTextEntry = { true }
                        style = { [
                            _dialogStyles.field,
                            inputDialogStyle.bottomField
                        ] }
                        underlineColorAndroid = { FIELD_UNDERLINE }
                        value = { this.state.password } />
                    { this._renderMessage() }
                </View>
            </CustomSubmitDialog>
        );
    }

    /**
     * Renders an optional message, if applicable.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderMessage() {
        const {
            _connecting: connecting,
            _error: error,
            _progress: progress,
            _styles: styles,
            t
        } = this.props;

        let messageKey;
        let messageIsError = false;
        const messageOptions = {};

        if (progress && progress < 1) {
            messageKey = 'connection.FETCH_SESSION_ID';
        } else if (error) {
            const { name } = error;

            if (name === JitsiConnectionErrors.PASSWORD_REQUIRED) {
                // Show a message that the credentials are incorrect only if the
                // credentials which have caused the connection to fail are the
                // ones which the user sees.
                const { credentials } = error;

                if (credentials
                        && credentials.jid
                            === toJid(
                                this.state.username,
                                this.props._configHosts)
                        && credentials.password === this.state.password) {
                    messageKey = 'dialog.incorrectPassword';
                    messageIsError = true;
                }
            } else if (name) {
                messageKey = 'dialog.connectErrorWithMsg';
                messageOptions.msg = `${name} ${error.message}`;
                messageIsError = true;
            }
        } else if (connecting) {
            messageKey = 'connection.CONNECTING';
        }

        if (messageKey) {
            const message = t(messageKey, messageOptions);
            const messageStyles = [
                styles.dialogText,
                messageIsError ? styles.errorMessage : styles.progressMessage
            ];

            return (
                <Text style = { messageStyles }>
                    { message }
                </Text>
            );
        }

        return null;
    }

    _onUsernameChange: (string) => void;

    /**
     * Called when user edits the username.
     *
     * @param {string} text - A new username value entered by user.
     * @returns {void}
     * @private
     */
    _onUsernameChange(text) {
        this.setState({
            username: text
        });
    }

    _onPasswordChange: (string) => void;

    /**
     * Called when user edits the password.
     *
     * @param {string} text - A new password value entered by user.
     * @returns {void}
     * @private
     */
    _onPasswordChange(text) {
        this.setState({
            password: text
        });
    }

    _onCancel: () => void;

    /**
     * Notifies this LoginDialog that it has been dismissed by cancel.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(cancelLogin());
    }

    _onLogin: () => void;

    /**
     * Notifies this LoginDialog that the login button (OK) has been pressed by
     * the user.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        const { _conference: conference, dispatch } = this.props;
        const { password, username } = this.state;
        const jid = toJid(username, this.props._configHosts);
        let r;

        // If there's a conference it means that the connection has succeeded,
        // but authentication is required in order to join the room.
        if (conference) {
            r = dispatch(authenticateAndUpgradeRole(jid, password, conference));
        } else {
            r = dispatch(connect(jid, password));
        }

        return r;
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code LoginDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const {
        error: authenticateAndUpgradeRoleError,
        progress,
        thenableWithCancel
    } = state['features/authentication'];
    const { authRequired } = state['features/base/conference'];
    const { hosts: configHosts } = state['features/base/config'];
    const {
        connecting,
        error: connectionError
    } = state['features/base/connection'];

    return {
        ..._abstractMapStateToProps(state),
        _conference: authRequired,
        _configHosts: configHosts,
        _connecting: Boolean(connecting) || Boolean(thenableWithCancel),
        _error: connectionError || authenticateAndUpgradeRoleError,
        _progress: progress,
        _styles: ColorSchemeRegistry.get(state, 'LoginDialog')
    };
}

export default translate(reduxConnect(_mapStateToProps)(LoginDialog));
