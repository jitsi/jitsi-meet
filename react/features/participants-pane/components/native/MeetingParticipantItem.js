// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import {
    getParticipantByIdOrUndefined,
    getParticipantDisplayName
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import {
    isParticipantAudioMuted,
    isParticipantVideoMuted
} from '../../../base/tracks';
import { MEDIA_STATE } from '../../constants';
import type { MediaState } from '../../constants';
import { getParticipantAudioMediaState } from '../../functions';

import ParticipantItem from './ParticipantItem';


type Props = {

    /**
     * Media state for audio.
     */
    _audioMediaState: MediaState,

    /**
     * The display name of the participant.
     */
    _displayName: string,

    /**
     * True if the participant is video muted.
     */
    _isVideoMuted: boolean,

    /**
     * True if the participant is the local participant.
     */
    _local: boolean,

    /**
     * The participant ID.
     */
    _participantID: string,

    /**
     * True if the participant have raised hand.
     */
    _raisedHand: boolean,

    /**
     * Callback to invoke when item is pressed.
     */
    onPress: Function,

    /**
     * The ID of the participant.
     */
    participantID: ?string
};

/**
 * Implements the MeetingParticipantItem component.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function MeetingParticipantItem({
    _audioMediaState,
    _displayName,
    _isVideoMuted,
    _local,
    _participantID,
    _raisedHand,
    onPress
}: Props) {
    return (
        <ParticipantItem
            audioMediaState = { _audioMediaState }
            displayName = { _displayName }
            isKnockingParticipant = { false }
            local = { _local }
            onPress = { onPress }
            participantID = { _participantID }
            raisedHand = { _raisedHand }
            videoMediaState = { _isVideoMuted ? MEDIA_STATE.MUTED : MEDIA_STATE.UNMUTED } />
    );
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state, ownProps): Object {
    const { participantID } = ownProps;
    const participant = getParticipantByIdOrUndefined(state, participantID);
    const _isAudioMuted = isParticipantAudioMuted(participant, state);
    const isVideoMuted = isParticipantVideoMuted(participant, state);
    const audioMediaState = getParticipantAudioMediaState(
        participant, _isAudioMuted, state
    );

    return {
        _audioMediaState: audioMediaState,
        _displayName: getParticipantDisplayName(state, participant?.id),
        _isAudioMuted,
        _isVideoMuted: isVideoMuted,
        _local: Boolean(participant?.local),
        _participantID: participant?.id,
        _raisedHand: Boolean(participant?.raisedHand)
    };
}


export default translate(connect(mapStateToProps)(MeetingParticipantItem));


