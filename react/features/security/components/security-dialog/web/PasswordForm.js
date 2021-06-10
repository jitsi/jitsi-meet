// @flow

import React, { Component } from 'react';

import { translate } from '../../../../base/i18n';
import { LOCKED_LOCALLY } from '../../../../room-lock';

/**
 * The type of the React {@code Component} props of {@link PasswordForm}.
 */
type Props = {

    /**
     * Whether or not to show the password editing field.
     */
    editEnabled: boolean,

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    locked: string,

    /**
     * Callback to invoke when the local participant is submitting a password
     * set request.
     */
    onSubmit: Function,

    /**
     * The current known password for the JitsiConference.
     */
    password: string,

    /**
     * The number of digits to be used in the password.
     */
    passwordNumberOfDigits: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link PasswordForm}.
 */
type State = {

    /**
     * The value of the password being entered by the local participant.
     */
    enteredPassword: string
};

/**
 * React {@code Component} for displaying and editing the conference password.
 *
 * @extends Component
 */
class PasswordForm extends Component<Props, State> {
    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props, state) {
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
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code PasswordForm} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onEnteredPasswordChange
            = this._onEnteredPasswordChange.bind(this);
        this._onPasswordSubmit = this._onPasswordSubmit.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <div className = 'info-password'>
                <span className = 'info-label'>
                    { t('info.password') }
                </span>
                <span className = 'spacer'>&nbsp;</span>
                <span className = 'info-password-field info-value'>
                    { this._renderPasswordField() }
                </span>
            </div>
        );
    }

    /**
     * Returns a ReactElement for showing the current state of the password or
     * for editing the current password.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderPasswordField() {
        if (this.props.editEnabled) {
            let digitPattern, placeHolderText;

            if (this.props.passwordNumberOfDigits) {
                placeHolderText = this.props.t('passwordDigitsOnly', {
                    number: this.props.passwordNumberOfDigits });
                digitPattern = '\\d*';
            }

            return (
                <form
                    className = 'info-password-form'
                    onKeyPress = { this._onKeyPress }
                    onSubmit = { this._onPasswordSubmit }>
                    <input
                        aria-label = { this.props.t('info.addPassword') }
                        autoFocus = { true }
                        className = 'info-password-input'
                        maxLength = { this.props.passwordNumberOfDigits }
                        onChange = { this._onEnteredPasswordChange }
                        pattern = { digitPattern }
                        placeholder = { placeHolderText }
                        spellCheck = { 'false' }
                        type = 'text'
                        value = { this.state.enteredPassword } />
                </form>
            );
        } else if (this.props.locked === LOCKED_LOCALLY) {
            return (
                <div className = 'info-password-local'>
                    { this.props.password }
                </div>
            );
        } else if (this.props.locked) {
            return (
                <div className = 'info-password-remote'>
                    { this.props.t('passwordSetRemotely') }
                </div>
            );
        }

        return (
            <div className = 'info-password-none'>
                { this.props.t('info.noPassword') }
            </div>
        );
    }

    _onEnteredPasswordChange: (Object) => void;

    /**
     * Updates the internal state of entered password.
     *
     * @param {Object} event - DOM Event for value change.
     * @private
     * @returns {void}
     */
    _onEnteredPasswordChange(event) {
        this.setState({ enteredPassword: event.target.value });
    }

    _onPasswordSubmit: (Object) => void;

    /**
     * Invokes the passed in onSubmit callback to notify the parent that a
     * password submission has been attempted.
     *
     * @param {Object} event - DOM Event for form submission.
     * @private
     * @returns {void}
     */
    _onPasswordSubmit(event) {
        event.preventDefault();
        event.stopPropagation();

        this.props.onSubmit(this.state.enteredPassword);
    }

    _onKeyPress: (Object) => void;

    /**
     * Stops the the EnterKey for propagation in order to prevent the dialog
     * to close.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyPress(event) {
        if (event.key === 'Enter') {
            event.stopPropagation();
        }
    }
}

export default translate(PasswordForm);
