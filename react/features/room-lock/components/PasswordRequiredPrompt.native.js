// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { setPassword } from '../../base/conference';
import { InputDialog } from '../../base/dialog';
import { connect } from '../../base/redux';
import { _cancelPasswordRequiredPrompt } from '../actions';

/**
 * {@code PasswordRequiredPrompt}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * The previously entered password, if any.
     */
    _password: ?string,

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

type State = {

    /**
     * The previously entered password, if any.
     */
    password: ?string
}

/**
 * Implements a React {@code Component} which prompts the user when a password
 * is required to join a conference.
 */
class PasswordRequiredPrompt extends Component<Props, State> {
    /**
     * Initializes a new {@code PasswordRequiredPrompt} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            password: props._password
        };

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate() {
        const { _password } = this.props;

        // The previous password in Redux gets cleared after the dialog appears and it ends up breaking the dialog
        // logic. We move the prop into state and only update it if it has an actual value, avoiding losing the
        // previously received value when Redux updates.
        if (_password && _password !== this.state.password) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                password: _password
            });
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { password } = this.state;

        return (
            <InputDialog
                contentKey = 'dialog.passwordLabel'
                initialValue = { password }
                messageKey = { password ? 'dialog.incorrectRoomLockPassword' : undefined }
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

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _password: state['features/base/conference'].password
    };
}

export default connect(_mapStateToProps)(PasswordRequiredPrompt);
