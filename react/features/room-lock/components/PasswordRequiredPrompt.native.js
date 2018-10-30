// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setPassword } from '../../base/conference';
import { Dialog } from '../../base/dialog';

import { _cancelPasswordRequiredPrompt } from '../actions';

/**
 * The style of the {@link TextInput} rendered by
 * {@code PasswordRequiredPrompt}. As it requests the entry of a password, the
 * entry should better be secure.
 */
const _TEXT_INPUT_PROPS = {
    secureTextEntry: true
};

/**
 * {@code PasswordRequiredPrompt}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * The {@code JitsiConference} which requires a password.
     *
     * @type {JitsiConference}
     */
    conference: { join: Function },

    /**
     * The redux dispatch function.
     */
    dispatch: Dispatch<*>
};

/**
 * Implements a React {@code Component} which prompts the user when a password
 * is required to join a conference.
 */
class PasswordRequiredPrompt extends Component<Props> {
    /**
     * Initializes a new {@code PasswordRequiredPrompt} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
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
                bodyKey = 'dialog.passwordLabel'
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                textInputProps = { _TEXT_INPUT_PROPS }
                titleKey = 'dialog.passwordRequired' />
        );
    }

    _onCancel: () => boolean;

    /**
     * Notifies this prompt that it has been dismissed by cancel.
     *
     * @private
     * @returns {boolean} If this prompt is to be closed/hidden, {@code true};
     * otherwise, {@code false}.
     */
    _onCancel() {
        this.props.dispatch(
            _cancelPasswordRequiredPrompt(this.props.conference));

        return true;
    }

    _onSubmit: (?string) => boolean;

    /**
     * Notifies this prompt that it has been dismissed by submitting a specific
     * value.
     *
     * @param {string|undefined} value - The submitted value.
     * @private
     * @returns {boolean} If this prompt is to be closed/hidden, {@code true};
     * otherwise, {@code false}.
     */
    _onSubmit(value: ?string) {
        const { conference }: { conference: { join: Function } } = this.props;

        this.props.dispatch(setPassword(conference, conference.join, value));

        return true;
    }
}

export default connect()(PasswordRequiredPrompt);
