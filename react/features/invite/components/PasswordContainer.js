import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { LOCKED_LOCALLY } from '../../room-lock';

import AddPasswordForm from './AddPasswordForm';
import LockStatePanel from './LockStatePanel';
import RemovePasswordForm from './RemovePasswordForm';

/**
 * React {@code Component} for displaying the current room lock state as well as
 * exposing features to modify the room lock.
 */
class PasswordContainer extends Component {
    /**
     * {@code PasswordContainer}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The JitsiConference for which to display a lock state and change the
         * password.
         *
         * @type {JitsiConference}
         */
        conference: React.PropTypes.object,

        /**
         * The value for how the conference is locked (or undefined if not
         * locked) as defined by room-lock constants.
         */
        locked: React.PropTypes.string,

        /**
         * The current known password for the JitsiConference.
         */
        password: React.PropTypes.string,

        /**
         * Whether or not the password editing components should be displayed.
         */
        showPasswordEdit: React.PropTypes.bool,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new {@code PasswordContainer} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Whether or not the form to edit the password should display. If
             * true, the form should display.
             *
             * @type {boolean}
             */
            isEditingPassword: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onTogglePasswordEdit = this._onTogglePasswordEdit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = 'password-overview'>
                <div className = 'password-overview-status'>
                    <LockStatePanel locked = { Boolean(this.props.locked) } />
                    { this._renderShowPasswordLink() }
                </div>
                { this._renderPasswordEdit() }
            </div>
        );
    }

    /**
     * Toggles the display of the ReactElements used to edit the password.
     *
     * @private
     * @returns {void}
     */
    _onTogglePasswordEdit() {
        this.setState({
            isEditingPassword: !this.state.isEditingPassword
        });
    }

    /**
     * Creates a ReactElement used for setting or removing a password.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderPasswordEdit() {
        if (!this.state.isEditingPassword) {
            return null;
        }

        return (
            this.props.locked
                ? <RemovePasswordForm
                    conference = { this.props.conference }
                    lockedLocally = { this.props.locked === LOCKED_LOCALLY }
                    password = { this.props.password } />
                : <AddPasswordForm conference = { this.props.conference } />
        );
    }

    /**
     * Creates a ReactElement that toggles displaying password edit components.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderShowPasswordLink() {
        if (!this.props.showPasswordEdit) {
            return null;
        }

        let toggleStatusKey;

        if (this.state.isEditingPassword) {
            toggleStatusKey = 'invite.hidePassword';
        } else if (this.props.locked) {
            toggleStatusKey = 'invite.showPassword';
        } else {
            toggleStatusKey = 'invite.addPassword';
        }

        return (
            <a
                className = 'password-overview-toggle-edit'
                onClick = { this._onTogglePasswordEdit }>
                { this.props.t(toggleStatusKey) }
            </a>
        );
    }
}

export default translate(PasswordContainer);
