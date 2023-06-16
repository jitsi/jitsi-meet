import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../../../base/i18n/functions';
import Input from '../../../../base/ui/components/web/Input';
import { LOCKED_LOCALLY } from '../../../../room-lock/constants';

/**
 * The type of the React {@code Component} props of {@link PasswordForm}.
 */
interface IProps extends WithTranslation {

    /**
     * Whether or not to show the password editing field.
     */
    editEnabled: boolean;

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    locked?: string;

    /**
     * Callback to invoke when the local participant is submitting a password
     * set request.
     */
    onSubmit: Function;

    /**
     * The current known password for the JitsiConference.
     */
    password?: string;

    /**
     * The number of digits to be used in the password.
     */
    passwordNumberOfDigits?: number;

    /**
     * Whether or not the password should be visible.
     */
    visible: boolean;
}

/**
 * The type of the React {@code Component} state of {@link PasswordForm}.
 */
interface IState {

    /**
     * The value of the password being entered by the local participant.
     */
    enteredPassword: string;
}

/**
 * React {@code Component} for displaying and editing the conference password.
 *
 * @augments Component
 */
class PasswordForm extends Component<IProps, IState> {
    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: IProps, state: IState) {
        return {
            enteredPassword: props.editEnabled ? state.enteredPassword : ''
        };
    }

    state = {
        enteredPassword: ''
    };

    /**
     * Initializes a new {@code PasswordForm} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code PasswordForm} instance with.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onEnteredPasswordChange = this._onEnteredPasswordChange.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = 'info-password'>
                {this._renderPassword()}
                {this._renderPasswordField()}
            </div>
        );
    }

    /** .........
     * Renders the password if there is any.
     *
     * @returns {ReactElement}
     */
    _renderPassword() {
        const { locked, t } = this.props;

        return locked && <>
            <span className = 'info-label'>
                {t('info.password')}
            </span>
            <span className = 'spacer'>&nbsp;</span>
            <span className = 'info-password-field info-value'>
                {locked === LOCKED_LOCALLY ? (
                    <div className = 'info-password-local'>
                        {this.props.visible ? this.props.password : '******' }
                    </div>
                ) : (
                    <div className = 'info-password-remote'>
                        {this.props.t('passwordSetRemotely')}
                    </div>
                ) }
                {this._renderPasswordField()}
            </span>
        </>;
    }

    /**
     * Returns a ReactElement for showing the current state of the password or
     * for editing the current password.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderPasswordField() {
        const {
            editEnabled,
            passwordNumberOfDigits,
            t
        } = this.props;

        if (editEnabled) {
            let placeHolderText = t('dialog.password');

            if (passwordNumberOfDigits) {
                placeHolderText = this.props.t('passwordDigitsOnly', {
                    number: passwordNumberOfDigits });
            }

            return (
                <div
                    className = 'info-password-form'>
                    <Input
                        accessibilityLabel = { t('info.addPassword') }
                        autoFocus = { true }
                        id = 'info-password-input'
                        maxLength = { passwordNumberOfDigits }
                        mode = { passwordNumberOfDigits ? 'numeric' : undefined }
                        onChange = { this._onEnteredPasswordChange }
                        onKeyPress = { this._onKeyPress }
                        placeholder = { placeHolderText }
                        type = 'password'
                        value = { this.state.enteredPassword } />
                </div>
            );
        }
    }

    /**
     * Updates the internal state of entered password.
     *
     * @param {string} value - DOM Event for value change.
     * @private
     * @returns {void}
     */
    _onEnteredPasswordChange(value: string) {
        this.setState({ enteredPassword: value });
    }

    /**
     * Stops the the EnterKey for propagation in order to prevent the dialog
     * to close.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyPress(event: React.KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();

            this.props.onSubmit(this.state.enteredPassword);
        }
    }
}

export default translate(PasswordForm);
