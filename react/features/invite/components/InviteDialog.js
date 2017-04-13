import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import JitsiMeetJS from '../../base/lib-jitsi-meet';
import {
    getLocalParticipant,
    PARTICIPANT_ROLE
} from '../../base/participants';

import PasswordContainer from './PasswordContainer';
import ShareLinkForm from './ShareLinkForm';

/**
 * A React Component for displaying other components responsible for copying the
 * current conference url and for setting or removing a conference password.
 */
class InviteDialog extends Component {
    /**
     * InviteDialog component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The redux store representation of the JitsiConference.
         *
         */
        _conference: React.PropTypes.object,

        /**
         * Whether or not the current user is a conference moderator.
         */
        _isModerator: React.PropTypes.bool,

        /**
         * The url for the JitsiConference.
         */
        conferenceUrl: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    }

    /**
     * Reports an analytics event for the invite modal being closed.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        JitsiMeetJS.analytics.sendEvent('toolbar.invite.close');
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
                cancelDisabled = { true }
                okTitleKey = 'dialog.done'
                titleString = { this.props.t(
                    'invite.inviteTo',
                    { conferenceName: this.props._conference.room }) } >
                <div className = 'invite-dialog'>
                    <ShareLinkForm toCopy = { this.props.conferenceUrl } />
                    <PasswordContainer
                        conference = { this.props._conference.conference }
                        locked = { this.props._conference.locked }
                        password = { this.props._conference.password }
                        showPasswordEdit = { this.props._isModerator } />
                </div>
            </Dialog>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated InviteDialog's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _isModerator: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { role }
        = getLocalParticipant(state['features/base/participants']);

    return {
        _conference: state['features/base/conference'],
        _isModerator: role === PARTICIPANT_ROLE.MODERATOR
    };
}

export default translate(connect(_mapStateToProps)(InviteDialog));
