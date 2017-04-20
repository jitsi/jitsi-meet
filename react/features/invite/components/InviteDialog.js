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
import DialInNumbersForm from './DialInNumbersForm';

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
         * The url for retrieving dial-in numbers.
         */
        dialInNumbersUrl: React.PropTypes.string,

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
        const { _conference } = this.props;
        const titleString
            = this.props.t(
                'invite.inviteTo',
                { conferenceName: _conference.room });

        return (
            <Dialog
                cancelDisabled = { true }
                okTitleKey = 'dialog.done'
                titleString = { titleString }>
                <div className = 'invite-dialog'>
                    <ShareLinkForm toCopy = { this.props.conferenceUrl } />
                    { this._renderDialInNumbersForm() }
                    <PasswordContainer
                        conference = { _conference.conference }
                        locked = { _conference.locked }
                        password = { _conference.password }
                        showPasswordEdit = { this.props._isModerator } />
                </div>
            </Dialog>
        );
    }

    /**
     * Creates a React {@code Component} for displaying and copying to clipboard
     * telephone numbers for dialing in to the conference.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderDialInNumbersForm() {
        return (
            this.props.dialInNumbersUrl
                ? <DialInNumbersForm
                    dialInNumbersUrl = { this.props.dialInNumbersUrl } />
                : null
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
