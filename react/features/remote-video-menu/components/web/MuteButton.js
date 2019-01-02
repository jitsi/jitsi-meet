/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    createRemoteVideoMenuButtonEvent,
    sendAnalytics
} from '../../../analytics';
import { translate } from '../../../base/i18n';
import { openDialog } from '../../../base/dialog';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';
import MuteRemoteParticipantDialog from './MuteRemoteParticipantDialog';

/**
 * The type of the React {@code Component} props of {@link MuteButton}.
 */
type Props = {

    /**
     * Invoked to send a request for muting the participant with the passed
     * in participantID.
     */
    dispatch: Dispatch<*>,

    /**
     * Whether or not the participant is currently audio muted.
     */
    isAudioMuted: Function,

    /**
     * Callback to invoke when {@code MuteButton} is clicked.
     */
    onClick: Function,

    /**
     * The ID of the participant linked to the onClick callback.
     */
    participantID: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * a participant in the conference.
 *
 * @extends Component
 */
class MuteButton extends Component<Props> {
    /**
     * Initializes a new {@code MuteButton} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
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

    _onClick: () => void;

    /**
     * Dispatches a request to mute the participant with the passed in
     * participantID.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const { dispatch, onClick, participantID } = this.props;

        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'mute.button',
            {
                'participant_id': participantID
            }));

        dispatch(openDialog(MuteRemoteParticipantDialog, { participantID }));

        if (onClick) {
            onClick();
        }
    }
}

export default translate(connect()(MuteButton));
