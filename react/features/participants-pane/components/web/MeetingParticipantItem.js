// @flow

import React from 'react';

import {
    getLocalParticipant,
    getParticipantByIdOrUndefined,
    getParticipantDisplayName
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { isParticipantAudioMuted, isParticipantVideoMuted } from '../../../base/tracks';
import { ACTION_TRIGGER, MEDIA_STATE, type MediaState } from '../../constants';
import { getParticipantAudioMediaState, getQuickActionButtonType } from '../../functions';
import ParticipantQuickAction from '../ParticipantQuickAction';

import ParticipantItem from './ParticipantItem';
import { ParticipantActionEllipsis } from './styled';

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
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean,

    /**
     * The participant.
     */
    _participant: Object,

    /**
     * The participant ID.
     *
     * NOTE: This ID may be different from participantID prop in the case when we pass undefined for the local
     * participant. In this case the local participant ID will be filled trough _participantID prop.
     */
    _participantID: string,

    /**
     * The type of button to be rendered for the quick action.
     */
    _quickActionButtonType: string,

    /**
     * True if the participant have raised hand.
     */
    _raisedHand: boolean,

    /**
     * The translated ask unmute text for the qiuck action buttons.
     */
    askUnmuteText: string,

    /**
     * Is this item highlighted
     */
    isHighlighted: boolean,

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * The translated text for the mute participant button.
     */
    muteParticipantButtonText: string,

    /**
     * Callback for the activation of this item's context menu
     */
    onContextMenu: Function,

    /**
     * Callback for the mouse leaving this item
     */
    onLeave: Function,

    /**
     * The aria-label for the ellipsis action.
     */
    participantActionEllipsisLabel: string,

    /**
     * The ID of the participant.
     */
    participantID: ?string,

    /**
     * The translated "you" text.
     */
    youText: string
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
    _localVideoOwner,
    _local,
    _participant,
    _participantID,
    _quickActionButtonType,
    _raisedHand,
    askUnmuteText,
    isHighlighted,
    onContextMenu,
    onLeave,
    muteAudio,
    muteParticipantButtonText,
    participantActionEllipsisLabel,
    youText
}: Props) {
    return (
        <ParticipantItem
            actionsTrigger = { ACTION_TRIGGER.HOVER }
            audioMediaState = { _audioMediaState }
            displayName = { _displayName }
            isHighlighted = { isHighlighted }
            local = { _local }
            onLeave = { onLeave }
            participantID = { _participantID }
            raisedHand = { _raisedHand }
            videoMuteState = { _isVideoMuted ? MEDIA_STATE.MUTED : MEDIA_STATE.UNMUTED }
            youText = { youText }>
            {
                !_participant.isFakeParticipant && (
                    <>
                        <ParticipantQuickAction
                            askUnmuteText = { askUnmuteText }
                            buttonType = { _quickActionButtonType }
                            muteAudio = { muteAudio }
                            muteParticipantButtonText = { muteParticipantButtonText }
                            participantID = { _participantID } />
                        <ParticipantActionEllipsis
                            aria-label = { participantActionEllipsisLabel }
                            onClick = { onContextMenu } />
                    </>
                )
            }
            {
                _participant.isFakeParticipant && _localVideoOwner && (
                    <ParticipantActionEllipsis
                        aria-label = { participantActionEllipsisLabel }
                        onClick = { onContextMenu } />
                )
            }
        </ParticipantItem>
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
function _mapStateToProps(state, ownProps): Object {
    const { participantID } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state).id;

    const participant = getParticipantByIdOrUndefined(state, participantID);

    const _isAudioMuted = isParticipantAudioMuted(participant, state);
    const _isVideoMuted = isParticipantVideoMuted(participant, state);
    const _audioMediaState = getParticipantAudioMediaState(participant, _isAudioMuted, state);
    const _quickActionButtonType = getQuickActionButtonType(participant, _isAudioMuted, state);

    return {
        _audioMediaState,
        _displayName: getParticipantDisplayName(state, participant?.id),
        _isAudioMuted,
        _isVideoMuted,
        _local: Boolean(participant?.local),
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _participant: participant,
        _participantID: participant?.id,
        _quickActionButtonType,
        _raisedHand: Boolean(participant?.raisedHand)
    };
}

export default connect(_mapStateToProps)(MeetingParticipantItem);
