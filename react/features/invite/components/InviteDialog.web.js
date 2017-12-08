import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    TOOLBAR_INVITE_CLOSE,
    sendAnalyticsEvent
} from '../../analytics';
import { getInviteURL } from '../../base/connection';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../base/participants';

import DialInNumbersForm from './DialInNumbersForm';
import PasswordContainer from './PasswordContainer';
import ShareLinkForm from './ShareLinkForm';

/**
 * A React {@code Component} for displaying other components responsible for
 * copying the current conference url and for setting or removing a conference
 * password.
 */
class InviteDialog extends Component {
    /**
     * {@code InviteDialog} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The redux store representation of the JitsiConference.
         */
        _conference: PropTypes.object,

        /**
         * The url for the JitsiConference.
         */
        _inviteURL: PropTypes.string,

        /**
         * Whether or not the current user is a conference moderator.
         */
        _isModerator: PropTypes.bool,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Reports an analytics event for the invite modal being closed.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        sendAnalyticsEvent(TOOLBAR_INVITE_CLOSE);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _conference, _inviteURL, t } = this.props;
        const titleString
            = t('invite.inviteTo', { conferenceName: _conference.room });

        return (
            <Dialog
                cancelDisabled = { true }
                okTitleKey = 'dialog.done'
                titleString = { titleString }>
                <div className = 'invite-dialog'>
                    <ShareLinkForm toCopy = { _inviteURL } />
                    <DialInNumbersForm inviteURL = { _inviteURL } />
                    <PasswordContainer
                        conference = { _conference.conference }
                        locked = { _conference.locked }
                        password = { _conference.password }
                        showPasswordEdit = { this.props._isModerator } />
                </div>
            </Dialog>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code InviteDialog}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _inviteURL: string,
 *     _isModerator: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _conference: state['features/base/conference'],
        _inviteURL: getInviteURL(state),
        _isModerator:
            getLocalParticipant(state).role === PARTICIPANT_ROLE.MODERATOR
    };
}

export default translate(connect(_mapStateToProps)(InviteDialog));
