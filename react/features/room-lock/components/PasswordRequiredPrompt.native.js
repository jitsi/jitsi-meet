// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';

import { setPassword } from '../../base/conference';
import { InputDialog } from '../../base/dialog';

import { _cancelPasswordRequiredPrompt } from '../actions';

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
    dispatch: Dispatch<any>
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
            <InputDialog
                contentKey = 'dialog.passwordLabel'
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                textInputProps = {{
                    secureTextEntry: true
                }} />
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

// $FlowExpectedError
export default connect()(PasswordRequiredPrompt);
