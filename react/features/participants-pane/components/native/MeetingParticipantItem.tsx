import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantDisplayName,
    hasRaisedHand,
    isParticipantModerator
} from '../../../base/participants/functions';
import { FakeParticipant, IParticipant } from '../../../base/participants/types';
import {
    isParticipantAudioMuted,
    isParticipantVideoMuted
} from '../../../base/tracks/functions.native';
import { showConnectionStatus, showContextMenuDetails, showSharedVideoMenu } from '../../actions.native';
import type { MediaState } from '../../constants';
import { getParticipantAudioMediaState, getParticipantVideoMediaState } from '../../functions';

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
     * The participant ID.
     */
    _participantID: string;

    /**
     * True if the participant have raised hand.
     */
    _raisedHand: boolean;

    /**
     * Media state for video.
     */
    _videoMediaState: MediaState;

    /**
     * The redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The participant.
     */
    participant?: IParticipant;
}

/**
 * Implements the MeetingParticipantItem component.
 */
class MeetingParticipantItem extends PureComponent<IProps> {

    /**
     * Creates new MeetingParticipantItem instance.
     *
     * @param {IProps} props - The props of the component.
     */
    constructor(props: IProps) {
        super(props);

        this._onPress = this._onPress.bind(this);
    }

    /**
     * Handles MeetingParticipantItem press events.
     *
     * @returns {void}
     */
    _onPress() {
        const {
            _fakeParticipant,
            _local,
            _localVideoOwner,
            _participantID,
            dispatch
        } = this.props;

        if (_fakeParticipant && _localVideoOwner) {
            dispatch(showSharedVideoMenu(_participantID));
        } else if (!_fakeParticipant) {
            if (_local) {
                dispatch(showConnectionStatus(_participantID));
            } else {
                dispatch(showContextMenuDetails(_participantID));
            }
        } // else no-op
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _audioMediaState,
            _disableModeratorIndicator,
            _displayName,
            _isModerator,
            _local,
            _participantID,
            _raisedHand,
            _videoMediaState
        } = this.props;

        return (
            <ParticipantItem
                audioMediaState = { _audioMediaState }
                disableModeratorIndicator = { _disableModeratorIndicator }
                displayName = { _displayName }
                isModerator = { _isModerator }
                local = { _local }
                onPress = { this._onPress }
                participantID = { _participantID }
                raisedHand = { _raisedHand }
                videoMediaState = { _videoMediaState } />
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState, ownProps: any) {
    const { participant } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state)?.id;
    const _isAudioMuted = Boolean(participant && isParticipantAudioMuted(participant, state));
    const _isVideoMuted = isParticipantVideoMuted(participant, state);
    const audioMediaState = getParticipantAudioMediaState(participant, _isAudioMuted, state);
    const videoMediaState = getParticipantVideoMediaState(participant, _isVideoMuted, state);
    const { disableModeratorIndicator } = state['features/base/config'];
    const raisedHand = hasRaisedHand(participant?.local
        ? participant
        : getParticipantById(state, participant?.id)
    );

    return {
        _audioMediaState: audioMediaState,
        _disableModeratorIndicator: disableModeratorIndicator,
        _displayName: getParticipantDisplayName(state, participant?.id),
        _fakeParticipant: participant?.fakeParticipant,
        _isAudioMuted,
        _isModerator: isParticipantModerator(participant),
        _local: Boolean(participant?.local),
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _participantID: participant?.id,
        _raisedHand: raisedHand,
        _videoMediaState: videoMediaState
    };
}


export default translate(connect(mapStateToProps)(MeetingParticipantItem));
