import React, { useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';

import { IReduxState } from '../../../app/types';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantDisplayName,
    hasRaisedHand,
    isParticipantModerator
} from '../../../base/participants/functions';
import { FakeParticipant } from '../../../base/participants/types';
import {
    isParticipantAudioMuted,
    isParticipantVideoMuted
} from '../../../base/tracks/functions.native';
import { showContextMenuDetails, showSharedVideoMenu } from '../../actions.native';
import type { MediaState } from '../../constants';
import {
    getParticipantAudioMediaState,
    getParticipantVideoMediaState,
    participantMatchesSearch
} from '../../functions';

import ParticipantItem from './ParticipantItem';

interface IProps {

    /**
     * Media state for audio.
     */
    _audioMediaState: MediaState;

    /**
     * Whether or not to disable the moderator indicator.
     */
    _disableModeratorIndicator?: boolean;

    /**
     * The display name of the participant.
     */
    _displayName: string;

    /**
     * The type of fake participant.
     */
    _fakeParticipant: FakeParticipant;

    /**
     * Whether or not the user is a moderator.
     */
    _isModerator: boolean;

    /**
     * True if the participant is the local participant.
     */
    _local: boolean;

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean;

    /**
     * Whether or not the participant name matches the search string.
     */
    _matchesSearch: boolean;

    /**
     * True if the participant have raised hand.
     */
    _raisedHand: boolean;

    /**
     * Media state for video.
     */
    _videoMediaState: MediaState;

    /**
     * The participant ID.
     */
    participantID: string;

    /**
     * Name of the participant we search for.
     */
    searchString: string;
}

const MeetingParticipantItem = ({
    _audioMediaState,
    _disableModeratorIndicator,
    _displayName,
    _fakeParticipant,
    _isModerator,
    _local,
    _localVideoOwner,
    _matchesSearch,
    _raisedHand,
    _videoMediaState,
    participantID
}: IProps) => {
    const dispatch = useDispatch();
    const onPress = useCallback(() => {
        if (_fakeParticipant && _localVideoOwner) {
            dispatch(showSharedVideoMenu(participantID));
        } else if (!_fakeParticipant) {
            dispatch(showContextMenuDetails(participantID, _local));
        } // else no-op
    }, [ dispatch ]);

    if (!_matchesSearch) {
        return null;
    }

    return (
        <ParticipantItem
            audioMediaState = { _audioMediaState }
            disableModeratorIndicator = { _disableModeratorIndicator }
            displayName = { _displayName }
            isModerator = { _isModerator }
            local = { _local }
            onPress = { onPress }
            participantID = { participantID }
            raisedHand = { _raisedHand }
            videoMediaState = { _videoMediaState } />
    );
};

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantID, searchString } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const participant = getParticipantById(state, participantID);
    const localParticipantId = getLocalParticipant(state)?.id;
    const _isAudioMuted = isParticipantAudioMuted(participant, state);
    const _isVideoMuted = isParticipantVideoMuted(participant, state);
    const audioMediaState = getParticipantAudioMediaState(participant, _isAudioMuted, state);
    const videoMediaState = getParticipantVideoMediaState(participant, _isVideoMuted, state);
    const { disableModeratorIndicator } = state['features/base/config'];
    const raisedHand = hasRaisedHand(participant?.local
        ? participant
        : getParticipantById(state, participantID)
    );
    const _matchesSearch = participantMatchesSearch(participant, searchString);

    return {
        _audioMediaState: audioMediaState,
        _disableModeratorIndicator: disableModeratorIndicator,
        _displayName: getParticipantDisplayName(state, participantID),
        _fakeParticipant: participant?.fakeParticipant,
        _isAudioMuted,
        _isModerator: isParticipantModerator(participant),
        _local: Boolean(participant?.local),
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _matchesSearch,
        _raisedHand: raisedHand,
        _videoMediaState: videoMediaState
    };
}

// @ts-ignore
export default connect(mapStateToProps)(MeetingParticipantItem);
