import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

// @ts-expect-error
import { connect } from '../../../../../connection';
import { IReduxState, IStore } from '../../../app/types';
import { IJitsiConference } from '../../../base/conference/reducer';
import { IConfig } from '../../../base/config/configType';
import { toJid } from '../../../base/connection/functions';
import { translate, translateToHTML } from '../../../base/i18n/functions';
import { JitsiConnectionErrors } from '../../../base/lib-jitsi-meet';
import { connect as reduxConnect } from '../../../base/redux/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import Input from '../../../base/ui/components/web/Input';
import {
    authenticateAndUpgradeRole,
    cancelLogin
} from '../../actions.web';

/**
 * The type of the React {@code Component} props of {@link LoginDialog}.
 */
interface IProps extends WithTranslation {

    /**
     * {@link JitsiConference} That needs authentication - will hold a valid
     * value in XMPP login + guest access mode.
     */
    _conference: IJitsiConference;

    /**
     * The server hosts specified in the global config.
     */
    _configHosts: IConfig['hosts'];

    /**
     * Indicates if the dialog should display "connecting" status message.
     */
    _connecting: boolean;

    /**
     * The error which occurred during login/authentication.
     */
    _error: any;

    /**
     * The progress in the floating range between 0 and 1 of the authenticating
     * and upgrading the role of the local participant/user.
     */
    _progress: number;

    /**
     * Redux store dispatch method.
     */
    dispatch: IStore['dispatch'];

    /**
     * Invoked when username and password are submitted.
     */
    onSuccess: Function;

    /**
     * Conference room name.
     */
    roomName: string;
}

/**
 * The type of the React {@code Component} state of {@link LoginDialog}.
 */
interface IState {

    /**
     * Authentication process starts before joining the conference room.
     */
    loginStarted: boolean;

    /**
     * The user entered password for the conference.
     */
    password: string;

    /**
     * The user entered local participant name.
     */
    username: string;
}

/**
 * Component that renders the login in conference dialog.
 *
 *  @returns {React$Element<any>}
 */
class LoginDialog extends Component<IProps, IState> {
    /**
     * Initializes a new {@code LoginDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            username: '',
            password: '',
            loginStarted: false
        };

        this._onCancelLogin = this._onCancelLogin.bind(this);
        this._onLogin = this._onLogin.bind(this);
        this._onUsernameChange = this._onUsernameChange.bind(this);
        this._onPasswordChange = this._onPasswordChange.bind(this);
    }

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancelLogin() {
        const { dispatch } = this.props;

        dispatch(cancelLogin());
    }

    /**
     * Notifies this LoginDialog that the login button (OK) has been pressed by
     * the user.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        const {
            _conference: conference,
            _configHosts: configHosts,
            roomName,
            onSuccess,
            dispatch
        } = this.props;
        const { password, username } = this.state;
        const jid = toJid(username, configHosts ?? {
            authdomain: '',
            domain: ''
        });

        if (conference) {
            dispatch(authenticateAndUpgradeRole(jid, password, conference));
        } else {
            this.setState({
                loginStarted: true
            });

            connect(jid, password, roomName)
                .then((connection: any) => {
                    onSuccess?.(connection);
                })
                .catch(() => {
                    this.setState({
                        loginStarted: false
                    });
                });
        }
    }

    /**
     * Callback for the onChange event of the field.
     *
     * @param {string} value - The static event.
     * @returns {void}
     */
    _onPasswordChange(value: string) {
        this.setState({
            password: value
        });
    }

    /**
     * Callback for the onChange event of the username input.
     *
     * @param {string} value - The new value.
     * @returns {void}
     */
    _onUsernameChange(value: string) {
        this.setState({
            username: value
        });
    }

    /**
     * Renders an optional message, if applicable.
     *
     * @returns {ReactElement}
     * @private
     */
    renderMessage() {
        const {
            _configHosts: configHosts,
            _connecting: connecting,
            _error: error,
            _progress: progress,
            t
        } = this.props;
        const { username, password } = this.state;
        const messageOptions: any = {};
        let messageKey;

        if (progress && progress < 1) {
            messageKey = t('connection.FETCH_SESSION_ID');
        } else if (error) {
            const { name } = error;

            if (name === JitsiConnectionErrors.PASSWORD_REQUIRED) {
                const { credentials } = error;

                if (credentials
                    && credentials.jid === toJid(username, configHosts ?? { authdomain: '',
                        domain: '' })
                    && credentials.password === password) {
                    messageKey = t('dialog.incorrectPassword');
                }
            } else if (name) {
                messageKey = t('dialog.connectErrorWithMsg');
                messageOptions.msg = `${name} ${error.message}`;
            }
        } else if (connecting) {
            messageKey = t('connection.CONNECTING');
        }

        if (messageKey) {
            return (
                <span>
                    { translateToHTML(t, messageKey, messageOptions) }
                </span>
            );
        }

        return null;
    }

    /**
     * Implements {@Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _connecting: connecting,
            t
        } = this.props;
        const { password, loginStarted, username } = this.state;

        return (
            <Dialog
                disableAutoHideOnSubmit = { true }
                disableBackdropClose = { true }
                hideCloseButton = { true }
                ok = {{
                    disabled: connecting
                        || loginStarted
                        || !password
                        || !username,
                    translationKey: 'dialog.login'
                }}
                onCancel = { this._onCancelLogin }
                onSubmit = { this._onLogin }
                titleKey = { t('dialog.authenticationRequired') }>
                <Input
                    autoFocus = { true }
                    label = { t('dialog.user') }
                    name = 'username'
                    onChange = { this._onUsernameChange }
                    placeholder = { t('dialog.userIdentifier') }
                    type = 'text'
                    value = { username } />
                <br />
                <Input
                    className = 'dialog-bottom-margin'
                    label = { t('dialog.userPassword') }
                    name = 'password'
                    onChange = { this._onPasswordChange }
                    placeholder = { t('dialog.password') }
                    type = 'password'
                    value = { password } />
                { this.renderMessage() }
            </Dialog>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code LoginDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    const {
        error: authenticateAndUpgradeRoleError,
        progress,
        thenableWithCancel
    } = state['features/authentication'];
    const { authRequired, conference } = state['features/base/conference'];
    const { hosts: configHosts } = state['features/base/config'];
    const {
        connecting,
        error: connectionError
    } = state['features/base/connection'];

    return {
        _conference: authRequired || conference,
        _configHosts: configHosts,
        _connecting: connecting || thenableWithCancel,
        _error: connectionError || authenticateAndUpgradeRoleError,
        _progress: progress
    };
}

export default translate(reduxConnect(mapStateToProps)(LoginDialog));
