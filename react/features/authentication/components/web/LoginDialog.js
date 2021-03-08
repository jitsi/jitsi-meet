// @flow

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

declare var config: Object;

/**
 * The type of the React {@code Component} props of {@link LoginDialog}.
 */
type Props = {

    /**
     * Redux store dispatch method.
     */
    dispatch: Dispatch<any>,

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
    username: string
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
            connecting: false,
            error: {}
        };

        this._onCancel = this._onCancel.bind(this);
        this._onLogin = this._onLogin.bind(this);
        this._onChange = this._onChange.bind(this);
    }

    _onCancel: () => void;

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        console.log('Cancel');
    }

    _onLogin: () => void;

    /**
     * Called when the login button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        this.setState({
            connecting: true
        });
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

    }

    /**
     * Implements {@Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const placeholder = config.hosts.authdomain
            ? 'user identity'
            : 'user@domain.net';
        const { t } = this.props;
        const { connecting, password, username } = this.state;

        return (
            <Dialog
                hideCancelButton = { connecting }
                okDisabled = { connecting }
                onCancel = { this._onCancel }
                onSubmit = { this._onLogin }
                submitDisabled = { connecting }
                width = { 'small' }>
                { connecting ? t('connection.CONNECTING') : (<>
                    <TextField
                        autoFocus = { true }
                        className = 'input-control'
                        compact = { false }
                        label = { t('dialog.user') }
                        name = 'username'
                        onChange = { this._onChange }
                        placeholder = { placeholder }
                        shouldFitContainer = { true }
                        type = 'text'
                        value = { username } />
                    <TextField
                        autoFocus = { true }
                        className = 'input-control'
                        compact = { false }
                        label = { t('dialog.userPassword') }
                        name = 'password'
                        onChange = { this._onChange }
                        shouldFitContainer = { true }
                        type = 'password'
                        value = { password } />
                </>)}
            </Dialog>
        );
    }
}

export default translate(connect()(LoginDialog));
