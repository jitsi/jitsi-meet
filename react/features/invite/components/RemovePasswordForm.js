import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { setPassword } from '../../base/conference';
import { translate } from '../../base/i18n';

/**
 * A React {@code Component} for removing a lock from a JitsiConference.
 */
class RemovePasswordForm extends Component {
    /**
     * {@code RemovePasswordForm}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The JitsiConference on which remove a lock.
         *
         * @type {JitsiConference}
         */
        conference: PropTypes.object,

        /**
         * Invoked to send a password removal request.
         */
        dispatch: PropTypes.func,

        /**
         * Whether or not the room lock, if any, was set by the local user.
         */
        lockedLocally: PropTypes.bool,

        /**
         * The current known password for the JitsiConference.
         */
        password: PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code RemovePasswordForm} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
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
        const { lockedLocally, password, t } = this.props;

        return (
            <span>
                <span>
                    { `${t('dialog.currentPassword')} ` }
                </span>
                <span className = 'remove-password-current'>
                    { lockedLocally ? password : t('passwordSetRemotely') }
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
        const { conference } = this.props;

        this.props.dispatch(setPassword(
            conference,
            conference.lock,
            ''
        ));
    }
}

export default translate(connect()(RemovePasswordForm));
