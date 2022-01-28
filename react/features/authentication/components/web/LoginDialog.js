// @flow

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { connect } from '../../../../../connection';
import { toJid } from '../../../base/connection/functions';
import { Dialog } from '../../../base/dialog';
import { translate, translateToHTML } from '../../../base/i18n';
import { JitsiConnectionErrors } from '../../../base/lib-jitsi-meet';
import { connect as reduxConnect } from '../../../base/redux';
import {
    authenticateAndUpgradeRole,
    cancelLogin
} from '../../actions.web';

/**
 * The type of the React {@code Component} props of {@link LoginDialog}.
 */
type Props = {

    /**
     * {@link JitsiConference} That needs authentication - will hold a valid
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
     * The error which occurred during login/authentication.
     */
    _error: Object,

    /**
     * The progress in the floating range between 0 and 1 of the authenticating
     * and upgrading the role of the local participant/user.
     */
    _progress: number,

    /**
     * Redux store dispatch method.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked when username and password are submitted.
     */
    onSuccess: Function,

    /**
     * Conference room name.
     */
    roomName: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * The type of the React {@code Component} state of {@link LoginDialog}.
 */
type State = {

    /**
     * The user entered password for the conference.
     */
    password: string,

    /**
     * The user entered local participant name.
     */
    username: string,

    /**
     * Authentication process starts before joining the conference room.
     */
    loginStarted: boolean
}

/**
 * Component that renders the login in conference dialog.
 *
 *  @returns {React$Element<any>}
 */
class LoginDialog extends Component<Props, State> {
    /**
     * Initializes a new {@code LoginDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            loginStarted: false
        };

        this._onCancelLogin = this._onCancelLogin.bind(this);
        this._onLogin = this._onLogin.bind(this);
        this._onChange = this._onChange.bind(this);
    }

    _onCancelLogin: () => void;

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

    _onLogin: () => void;

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
        const jid = toJid(username, configHosts);

        if (conference) {
            dispatch(authenticateAndUpgradeRole(jid, password, conference));
        } else {
            this.setState({
                loginStarted: true
            });

            connect(jid, password, roomName)
                .then(connection => {
                    onSuccess && onSuccess(connection);
                })
                .catch(() => {
                    this.setState({
                        loginStarted: false
                    });
                });
        }
    }

    _onChange: Object => void;

    /**
     * Callback for the onChange event of the field.
     *
     * @param {Object} evt - The static event.
     * @returns {void}
     */
    _onChange(evt: Object) {
        this.setState({
            [evt.target.name]: evt.target.value
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
        const messageOptions = {};
        let messageKey;

        if (progress && progress < 1) {
            messageKey = t('connection.FETCH_SESSION_ID');
        } else if (error) {
            const { name } = error;

            if (name === JitsiConnectionErrors.PASSWORD_REQUIRED) {
                const { credentials } = error;

                if (credentials
                    && credentials.jid === toJid(username, configHosts)
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
                disableBlanketClickDismiss = { true }
                hideCloseIconButton = { true }
                okDisabled = {
                    connecting
                    || loginStarted
                    || !password
                    || !username
                }
                okKey = { t('dialog.login') }
                onCancel = { this._onCancelLogin }
                onSubmit = { this._onLogin }
                titleKey = { t('dialog.authenticationRequired') }
                width = { 'small' }>
                <TextField
                    autoFocus = { true }
                    className = 'input-control'
                    compact = { false }
                    label = { t('dialog.user') }
                    name = 'username'
                    onChange = { this._onChange }
                    placeholder = { t('dialog.userIdentifier') }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { username } />
                <TextField
                    className = 'input-control'
                    compact = { false }
                    label = { t('dialog.userPassword') }
                    name = 'password'
                    onChange = { this._onChange }
                    placeholder = { t('dialog.password') }
                    shouldFitContainer = { true }
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
 * @returns {Props}
 */
function mapStateToProps(state) {
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
