/* global APP */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import AKFieldText from '@atlaskit/field-text';

import { setPassword } from '../../base/conference';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

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
        dispatch: React.PropTypes.func,
        t: React.PropTypes.func
    }

    /**
     * Initializes a new PasswordRequiredPrompt instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = { password: '' };

        this._onPasswordChanged = this._onPasswordChanged.bind(this);
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
                isModal = { true }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.passwordRequired'
                width = 'small'>
                { this._renderBody() }
            </Dialog>);
    }

    /**
     * Display component in dialog body.
     *
     * @returns {ReactElement}
     * @protected
     */
    _renderBody() {
        const { t } = this.props;

        return (
            <div>
                <AKFieldText
                    compact = { true }
                    label = { t('dialog.passwordLabel') }
                    name = 'lockKey'
                    onChange = { this._onPasswordChanged }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { this.state.password } />
            </div>);
    }

    /**
     * Notifies this dialog that password has changed.
     *
     * @param {Object} event - The details of the notification/event.
     * @private
     * @returns {void}
     */
    _onPasswordChanged(event) {
        this.setState({ password: event.target.value });
    }

    /**
     * Dispatches action to submit value from thus dialog.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        const conference = this.props.conference;

        // we received that password is required, but user is trying
        // anyway to login without a password, mark room as not
        // locked in case he succeeds (maybe someone removed the
        // password meanwhile), if it is still locked another
        // password required will be received and the room again
        // will be marked as locked.
        if (!this.state.password || this.state.password === '') {
            // XXX temporary solution till we move the whole invite logic
            // in react
            APP.conference.invite.setLockedFromElsewhere(false);
        }

        this.props.dispatch(setPassword(
            conference, conference.join, this.state.password));

        // we have used the password lets clean it
        this.setState({ password: undefined });

        return true;
    }
}

export default translate(connect()(PasswordRequiredPrompt));
