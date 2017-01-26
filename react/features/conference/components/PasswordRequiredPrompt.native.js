import React, { Component } from 'react';
import Prompt from 'react-native-prompt';
import { connect } from 'react-redux';

import { setPassword } from '../../base/conference';

/**
 * Implements a React Component which prompts the user when a password is
 * required to join a conference.
 */
class PasswordRequiredPrompt extends Component {
    /**
     * PasswordRequiredPrompt component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The JitsiConference which requires a password.
         *
         * @type {JitsiConference}
         */
        conference: React.PropTypes.object,
        dispatch: React.PropTypes.func
    }

    /**
     * Initializes a new PasswordRequiredPrompt instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
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
            <Prompt
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                placeholder = 'Password'
                title = 'Password required'
                visible = { true } />
        );
    }

    /**
     * Notifies this prompt that it has been dismissed by cancel.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        // XXX The user has canceled this prompt for a password so we are to
        // attempt joining the conference without a password. If the conference
        // still requires a password to join, the user will be prompted again
        // later.
        this._onSubmit(undefined);
    }

    /**
     * Notifies this prompt that it has been dismissed by submitting a specific
     * value.
     *
     * @param {string} value - The submitted value.
     * @private
     * @returns {void}
     */
    _onSubmit(value) {
        const conference = this.props.conference;

        this.props.dispatch(setPassword(conference, conference.join, value));
    }
}

export default connect()(PasswordRequiredPrompt);
