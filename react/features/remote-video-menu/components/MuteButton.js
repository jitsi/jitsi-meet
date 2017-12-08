import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    REMOTE_VIDEO_MENU_MUTE_CLICKED,
    sendAnalyticsEvent
} from '../../analytics';
import { translate } from '../../base/i18n';
import { openDialog } from '../../base/dialog';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';
import MuteRemoteParticipantDialog from './MuteRemoteParticipantDialog';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * a participant in the conference.
 *
 * @extends Component
 */
class MuteButton extends Component {
    /**
     * {@code MuteButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to send a request for muting the participant with the passed
         * in participantID.
         */
        dispatch: PropTypes.func,

        /**
         * Whether or not the participant is currently audio muted.
         */
        isAudioMuted: PropTypes.bool,

        /**
         * Callback to invoke when {@code MuteButton} is clicked.
         */
        onClick: PropTypes.func,

        /**
         * The ID of the participant linked to the onClick callback.
         */
        participantID: PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code MuteButton} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { isAudioMuted, participantID, t } = this.props;
        const muteConfig = isAudioMuted ? {
            translationKey: 'videothumbnail.muted',
            muteClassName: 'mutelink disabled'
        } : {
            translationKey: 'videothumbnail.domute',
            muteClassName: 'mutelink'
        };

        return (
            <RemoteVideoMenuButton
                buttonText = { t(muteConfig.translationKey) }
                displayClass = { muteConfig.muteClassName }
                iconClass = 'icon-mic-disabled'
                id = { `mutelink_${participantID}` }
                onClick = { this._onClick } />
        );
    }

    /**
     * Dispatches a request to mute the participant with the passed in
     * participantID.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const { dispatch, onClick, participantID } = this.props;

        sendAnalyticsEvent(
            REMOTE_VIDEO_MENU_MUTE_CLICKED,
            {
                value: 1,
                label: participantID
            }
        );

        dispatch(openDialog(MuteRemoteParticipantDialog, { participantID }));

        if (onClick) {
            onClick();
        }
    }
}

export default translate(connect()(MuteButton));
