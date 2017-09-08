import React, { Component } from 'react';
import { connect as reduxConnect } from 'react-redux';
import {
    Button,
    Modal,
    Text,
    TextInput,
    View
} from 'react-native';
import {
    authenticateAndUpgradeRole,
    cancelLogin
} from '../actions';
import {
    connect,
    toJid
} from '../../base/connection';
import { translate } from '../../base/i18n';
import { JitsiConnectionErrors } from '../../base/lib-jitsi-meet';
import styles from './styles';

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
 * the {@link JitsiConference} instance. If user decides to authenticate a new
 * {@link JitsiAuthConnection} will be created from which separate XMPP
 * connection is established and authentication is performed. In case it
 * succeeds Jicofo will assign new session ID which then can be used from
 * the anonymous domain connection to create and join the room. This part is
 * done by {@link JitsiAuthConnection} from lib-jitsi-meet.
 *
 * See https://github.com/jitsi/jicofo#secure-domain for configuration
 * parameters description.
 */
class LoginDialog extends Component {
    /**
     * LoginDialog component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * {@link JitsiConference} that needs authentication - will hold a valid
         * value in XMPP login + guest access mode.
         */
        conference: React.PropTypes.object,

        /**
         *
         */
        configHosts: React.PropTypes.object,

        /**
         * Indicates if the dialog should display "connecting" status message.
         */
        connecting: React.PropTypes.bool,

        /**
         * Redux store dispatch method.
         */
        dispatch: React.PropTypes.func,

        /**
         * The error which occurred during login/authentication.
         */
        error: React.PropTypes.string,

        /**
         * Any extra details about the error provided by lib-jitsi-meet.
         */
        errorDetails: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new LoginDialog instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onCancel = this._onCancel.bind(this);
        this._onLogin = this._onLogin.bind(this);
        this._onUsernameChange = this._onUsernameChange.bind(this);
        this._onPasswordChange = this._onPasswordChange.bind(this);

        this.state = {
            username: '',
            password: ''
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            error,
            errorDetails,
            connecting,
            t
        } = this.props;

        let messageKey = '';
        const messageOptions = { };

        if (error === JitsiConnectionErrors.PASSWORD_REQUIRED) {
            messageKey = 'dialog.incorrectPassword';
        } else if (error) {
            messageKey = 'dialog.connectErrorWithMsg';

            messageOptions.msg = `${error} ${errorDetails}`;
        }

        return (
            <Modal
                onRequestClose = { this._onCancel }
                style = { styles.outerArea }
                transparent = { true } >
                <View style = { styles.dialogBox }>
                    <Text>Username:</Text>
                    <TextInput
                        onChangeText = { this._onUsernameChange }
                        placeholder = { 'user@domain.com' }
                        style = { styles.textInput }
                        value = { this.state.username } />
                    <Text>Password:</Text>
                    <TextInput
                        onChangeText = { this._onPasswordChange }
                        placeholder = { t('dialog.userPassword') }
                        secureTextEntry = { true }
                        style = { styles.textInput }
                        value = { this.state.password } />
                    <Text>
                        {error ? t(messageKey, messageOptions) : ''}
                        {connecting && !error
                            ? t('connection.CONNECTING') : ''}
                    </Text>
                    <Button
                        disabled = { connecting }
                        onPress = { this._onLogin }
                        title = { t('dialog.Ok') } />
                    <Button
                        onPress = { this._onCancel }
                        title = { t('dialog.Cancel') } />
                </View>
            </Modal>
        );
    }

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

    /**
     * Notifies this LoginDialog that it has been dismissed by cancel.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(cancelLogin());
    }

    /**
     * Notifies this LoginDialog that the login button (OK) has been pressed by
     * the user.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        const conference = this.props.conference;
        const { username, password } = this.state;
        const jid = toJid(username, this.props.configHosts);

        // If there's a conference it means that the connection has succeeded,
        // but authentication is required in order to join the room.
        if (conference) {
            this.props.dispatch(
                authenticateAndUpgradeRole(jid, password, conference));
        } else {
            this.props.dispatch(connect(jid, password));
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code LoginDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     configHosts: Object,
 *     connecting: boolean,
 *     error: string,
 *     errorDetails: string,
 *     conference: JitsiConference
 * }}
 */
function _mapStateToProps(state) {
    const { hosts: configHosts } = state['features/base/config'];
    const {
        connecting,
        error: connectionError,
        errorMessage: connectionErrorMessage
    } = state['features/base/connection'];
    const {
        authRequired
    } = state['features/base/conference'];
    const {
        upgradeRoleError,
        upgradeRoleInProgress
    } = state['features/authentication'];

    const error
        = connectionError
            || (upgradeRoleError
                && (upgradeRoleError.connectionError
                        || upgradeRoleError.authenticationError));

    return {
        configHosts,
        connecting: Boolean(connecting) || Boolean(upgradeRoleInProgress),
        error,
        errorDetails:
            (connectionError && connectionErrorMessage)
                || (upgradeRoleError && upgradeRoleError.message),
        conference: authRequired
    };
}

export default translate(reduxConnect(_mapStateToProps)(LoginDialog));
