import Button from '@atlaskit/button';
import { FieldText } from '@atlaskit/field-text';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setPassword } from '../../base/conference';
import { translate } from '../../base/i18n';

/**
 * A React {@code Component} for locking a JitsiConference with a password.
 */
class AddPasswordForm extends Component {
    /**
     * {@code AddPasswordForm}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The JitsiConference on which to lock and set a password.
         *
         * @type {JitsiConference}
         */
        conference: React.PropTypes.object,

        /**
         * Invoked to set a password on the conference.
         */
        dispatch: React.PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new {@code AddPasswordForm} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * The current value to display in {@code AddPasswordForm}
             * component's input field. The value is also used as the desired
             * new password when creating a {@code setPassword} action.
             *
             * @type {string}
             */
            password: ''
        };

        /**
         * The internal reference to the React {@code component} for entering a
         * password.
         *
         * @private
         * @type {ReactComponent}
         */
        this._inputComponent = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onPasswordChange = this._onPasswordChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._setInput = this._setInput.bind(this);
    }

    /**
     * Directly bind a handler to the input element. This is done in order to
     * intercept enter presses so any outer forms do not become submitted.
     * Atlaskit Button does not expose a way to hook onto keydown events.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._inputComponent.input.onkeydown = this._onKeyDown;
    }

    /**
     * Remove any handlers set directly on DOM elements.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._inputComponent.input.onkeydown = null;
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
            <div
                className = 'form-control'
                onSubmit = { this._onSubmit } >
                <div className = 'form-control__container'>
                    <div className = 'form-control__input-container'>
                        <FieldText
                            autoFocus = { true }
                            compact = { true }
                            id = 'newPasswordInput'
                            isLabelHidden = { true }
                            label = 'Enter Password'
                            onChange = { this._onPasswordChange }
                            onKeyDown = { this._onKeyDown }
                            placeholder = { t('dialog.createPassword') }
                            ref = { this._setInput }
                            shouldFitContainer = { true }
                            type = 'text' />
                    </div>
                    <Button
                        id = 'addPasswordBtn'
                        isDisabled = { !this.state.password }
                        onClick = { this._onSubmit }
                        shouldFitContainer = { true }
                        type = 'button'>
                        { t('dialog.add') }
                    </Button>
                </div>
            </div>
        );
    }

    /**
     * Mimics form behavior by listening for enter key press and submitting the
     * entered password.
     *
     * @param {Object} event - DOM Event for keydown.
     * @private
     * @returns {void}
     */
    _onKeyDown(event) {
        event.stopPropagation();

        if (event.keyCode === /* Enter */ 13) {
            this._onSubmit();
        }
    }

    /**
     * Updates the internal state of the entered password.
     *
     * @param {Object} event - DOM Event for value change.
     * @private
     * @returns {void}
     */
    _onPasswordChange(event) {
        this.setState({ password: event.target.value });
    }

    /**
     * Dispatches a request to lock the conference with a password.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        if (!this.state.password) {
            return;
        }

        const { conference } = this.props;

        this.props.dispatch(setPassword(
            conference,
            conference.lock,
            this.state.password
        ));

        this.setState({ password: '' });
    }

    /**
     * Sets the instance variable for the React Component used for entering a
     * password.
     *
     * @param {Object} inputComponent - The React Component for the input
     * field.
     * @private
     * @returns {void}
     */
    _setInput(inputComponent) {
        if (inputComponent !== this._inputComponent) {
            this._inputComponent = inputComponent;
        }
    }
}

export default translate(connect()(AddPasswordForm));
