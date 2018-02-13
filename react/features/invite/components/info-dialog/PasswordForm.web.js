import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { LOCKED_LOCALLY } from '../../../room-lock';

/**
 * React {@code Component} for displaying and editing the conference password.
 *
 * @extends Component
 */
class PasswordForm extends Component {
    /**
     * {@code PasswordForm} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not to show the password editing field.
         */
        editEnabled: PropTypes.bool,

        /**
         * The value for how the conference is locked (or undefined if not
         * locked) as defined by room-lock constants.
         */
        locked: PropTypes.string,

        /**
         * Callback to invoke when the local participant is submitting a
         * password set request.
         */
        onSubmit: PropTypes.func,

        /**
         * The current known password for the JitsiConference.
         */
        password: PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * {@code PasswordForm} component's local state.
     *
     * @type {Object}
     * @property {string} enteredPassword - The value of the password being
     * entered by the local participant.
     */
    state = {
        enteredPassword: ''
    };

    /**
     * Initializes a new {@code PasswordForm} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code PasswordForm} instance with.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onEnteredPasswordChange
            = this._onEnteredPasswordChange.bind(this);
        this._onPasswordSubmit = this._onPasswordSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#componentWillReceiveProps()}. Invoked
     * before this mounted component receives new props.
     *
     * @inheritdoc
     * @param {Props} nextProps - New props component will receive.
     */
    componentWillReceiveProps(nextProps) {
        if (this.props.editEnabled && !nextProps.editEnabled) {
            this.setState({ enteredPassword: '' });
        }
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
                <div>{ t('info.password') }</div>
                <div className = 'info-password-field'>
                    { this._renderPasswordField() }
                </div>
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
            return (
                <form
                    className = 'info-password-form'
                    onSubmit = { this._onPasswordSubmit }>
                    <input
                        autoFocus = { true }
                        className = 'info-password-input'
                        onChange = { this._onEnteredPasswordChange }
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

        this.props.onSubmit(this.state.enteredPassword);
    }
}


export default translate(PasswordForm);
