import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setPassword } from '../../base/conference';
import { translate } from '../../base/i18n';

/**
 * A React Component for removing a lock from a JitsiConference.
 */
class RemovePasswordForm extends Component {
    /**
     * RemovePasswordForm component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The JitsiConference on which remove a lock.
         *
         * @type {JitsiConference}
         */
        conference: React.PropTypes.object,

        /**
         * Invoked to send a password removal request.
         */
        dispatch: React.PropTypes.func,

        /**
         * Whether or not the room lock, if any, was set by the local user.
         */
        lockedLocally: React.PropTypes.bool,

        /**
         * The current known password for the JitsiConference.
         */
        password: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    }

    /**
     * Initializes a new RemovePasswordForm instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @private
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = 'remove-password'>
                <div className = 'remove-password-description'>
                    { this._getPasswordPreviewText() }
                </div>
                <a
                    className = 'remove-password-link'
                    id = 'inviteDialogRemovePassword'
                    onClick = { this._onClick }>
                    { this.props.t('dialog.removePassword') }
                </a>
            </div>
        );
    }

    /**
     * Creates a ReactElement for displaying the current password.
     *
     * @private
     * @returns {ReactElement}
     */
    _getPasswordPreviewText() {
        return (
            <span>
                <span>
                    { `${this.props.t('dialog.currentPassword')} ` }
                </span>
                <span className = 'remove-password-current'>
                    { this.props.lockedLocally
                        ? this.props.password
                        : this.props.t('passwordSetRemotely') }
                </span>
            </span>
        );
    }

    /**
     * Dispatches a request to remove any set password on the JitsiConference.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const conference = this.props.conference;

        this.props.dispatch(setPassword(
            conference,
            conference.lock,
            ''
        ));
    }
}

export default translate(connect()(RemovePasswordForm));
