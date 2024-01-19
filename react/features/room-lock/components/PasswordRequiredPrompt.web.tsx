import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IStore } from '../../app/types';
import { setPassword } from '../../base/conference/actions';
import { IJitsiConference } from '../../base/conference/reducer';
import { translate } from '../../base/i18n/functions';
import Dialog from '../../base/ui/components/web/Dialog';
import Input from '../../base/ui/components/web/Input';
import { _cancelPasswordRequiredPrompt } from '../actions';

/**
 * The type of the React {@code Component} props of
 * {@link PasswordRequiredPrompt}.
 */
interface IProps extends WithTranslation {

    /**
     * The JitsiConference which requires a password.
     */
    conference: IJitsiConference;

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];
}

/**
 * The type of the React {@code Component} state of
 * {@link PasswordRequiredPrompt}.
 */
interface IState {

    /**
     * The password entered by the local participant.
     */
    password?: string;
}

/**
 * Implements a React Component which prompts the user when a password is
 * required to join a conference.
 */
class PasswordRequiredPrompt extends Component<IProps, IState> {
    state = {
        password: ''
    };

    /**
     * Initializes a new PasswordRequiredPrompt instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onPasswordChanged = this._onPasswordChanged.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                disableBackdropClose = { true }
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.passwordRequired'>
                { this._renderBody() }
            </Dialog>
        );
    }

    /**
     * Display component in dialog body.
     *
     * @returns {ReactElement}
     * @protected
     */
    _renderBody() {
        return (
            <div>
                <Input
                    autoFocus = { true }
                    className = 'dialog-bottom-margin'
                    id = 'required-password-input'
                    label = { this.props.t('dialog.passwordLabel') }
                    name = 'lockKey'
                    onChange = { this._onPasswordChanged }
                    type = 'password'
                    value = { this.state.password } />
            </div>
        );
    }

    /**
     * Notifies this dialog that password has changed.
     *
     * @param {string} value - The details of the notification/event.
     * @private
     * @returns {void}
     */
    _onPasswordChanged(value: string) {
        this.setState({
            password: value
        });
    }

    /**
     * Dispatches action to cancel and dismiss this dialog.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {

        this.props.dispatch(
            _cancelPasswordRequiredPrompt(this.props.conference));

        return true;
    }

    /**
     * Dispatches action to submit value from this dialog.
     *
     * @private
     * @returns {boolean}
     */
    _onSubmit() {
        const { conference } = this.props;

        // We received that password is required, but user is trying anyway to
        // login without a password. Mark the room as not locked in case she
        // succeeds (maybe someone removed the password meanwhile). If it is
        // still locked, another password required will be received and the room
        // again will be marked as locked.
        this.props.dispatch(
            setPassword(conference, conference.join, this.state.password));

        // We have used the password so let's clean it.
        this.setState({
            password: undefined
        });

        return true;
    }
}

export default translate(connect()(PasswordRequiredPrompt));
