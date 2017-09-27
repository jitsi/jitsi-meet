import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setPassword } from '../../base/conference';
import { Dialog } from '../../base/dialog';

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
        conference: PropTypes.object,
        dispatch: PropTypes.func
    };

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
            <Dialog
                bodyKey = 'dialog.passwordLabel'
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.passwordRequired' />
        );
    }

    /**
     * Notifies this prompt that it has been dismissed by cancel.
     *
     * @private
     * @returns {boolean} True to hide this dialog/prompt; otherwise, false.
     */
    _onCancel() {
        // XXX The user has canceled this prompt for a password so we are to
        // attempt joining the conference without a password. If the conference
        // still requires a password to join, the user will be prompted again
        // later.
        return this._onSubmit(undefined);
    }

    /**
     * Notifies this prompt that it has been dismissed by submitting a specific
     * value.
     *
     * @param {string} value - The submitted value.
     * @private
     * @returns {boolean} True to hide this dialog/prompt; otherwise, false.
     */
    _onSubmit(value) {
        const conference = this.props.conference;

        this.props.dispatch(setPassword(conference, conference.join, value));

        return true;
    }
}

export default connect()(PasswordRequiredPrompt);
