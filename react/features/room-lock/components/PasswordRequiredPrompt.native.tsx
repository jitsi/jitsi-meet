import React, { Component } from 'react';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../app/types';
import { setPassword } from '../../base/conference/actions';
import { IJitsiConference } from '../../base/conference/reducer';
import InputDialog from '../../base/dialog/components/native/InputDialog';
import { _cancelPasswordRequiredPrompt } from '../actions';

/**
 * {@code PasswordRequiredPrompt}'s React {@code Component} prop types.
 */
interface IProps {

    /**
     * The previously entered password, if any.
     */
    _password?: string;

    /**
     * Number of digits used in the room-lock password.
     */
    _passwordNumberOfDigits?: number;

    /**
     * The {@code JitsiConference} which requires a password.
     *
     * @type {JitsiConference}
     */
    conference: IJitsiConference;

    /**
     * The redux dispatch function.
     */
    dispatch: IStore['dispatch'];
}

interface IState {

    /**
     * The previously entered password, if any.
     */
    password?: string;
}

/**
 * Implements a React {@code Component} which prompts the user when a password
 * is required to join a conference.
 */
class PasswordRequiredPrompt extends Component<IProps, IState> {
    /**
     * Initializes a new {@code PasswordRequiredPrompt} instance.
     *
     * @param {IProps} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: IProps) {
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
    override componentDidUpdate() {
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
    override render() {
        const { password } = this.state;
        const { _passwordNumberOfDigits } = this.props;
        const textInputProps: any = {
            secureTextEntry: true
        };

        if (_passwordNumberOfDigits) {
            textInputProps.keyboardType = 'numeric';
            textInputProps.maxLength = _passwordNumberOfDigits;
        }

        return (
            <InputDialog
                descriptionKey = 'dialog.passwordLabel'
                initialValue = { password }
                messageKey = { password ? 'dialog.incorrectRoomLockPassword' : undefined }
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                textInputProps = { textInputProps }
                titleKey = 'dialog.password' />
        );
    }

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

    /**
     * Notifies this prompt that it has been dismissed by submitting a specific
     * value.
     *
     * @param {string|undefined} value - The submitted value.
     * @private
     * @returns {boolean} If this prompt is to be closed/hidden, {@code true};
     * otherwise, {@code false}.
     */
    _onSubmit(value?: string) {
        const { conference } = this.props;

        this.props.dispatch(setPassword(conference, conference.join, value));

        return true;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { roomPasswordNumberOfDigits } = state['features/base/config'];

    return {
        _password: state['features/base/conference'].password,
        _passwordNumberOfDigits: roomPasswordNumberOfDigits
    };
}

export default connect(_mapStateToProps)(PasswordRequiredPrompt);
