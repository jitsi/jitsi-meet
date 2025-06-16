import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getSsrcRewritingFeatureFlag } from '../../../base/config/functions.any';
import { JitsiTrackEvents } from '../../../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../../base/media/constants';
import {
    getLocalParticipant,
    getMutedStateByParticipantAndMediaType,
    getParticipantByIdOrUndefined,
    getParticipantDisplayName,
    hasRaisedHand,
    isParticipantModerator
} from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import {
    getLocalAudioTrack,
    getTrackByMediaTypeAndParticipant,
    isParticipantAudioMuted,
    isParticipantVideoMuted
} from '../../../base/tracks/functions.web';
import { ITrack } from '../../../base/tracks/types';
import { ACTION_TRIGGER, MEDIA_STATE, type MediaState } from '../../constants';
import {
    getParticipantAudioMediaState,
    getParticipantVideoMediaState,
    getQuickActionButtonType,
    participantMatchesSearch
} from '../../functions';

import ParticipantActionEllipsis from './ParticipantActionEllipsis';
import ParticipantItem from './ParticipantItem';
import ParticipantQuickAction from './ParticipantQuickAction';

interface IProps {

    /**
     * Media state for audio.
     */
    _audioMediaState: MediaState;

    /**
     * The audio track related to the participant.
     */
    _audioTrack?: ITrack;

    /**
     * Whether or not to disable the moderator indicator.
     */
    _disableModeratorIndicator: boolean;

    /**
     * The display name of the participant.
     */
    _displayName: string;

    /**
     * Whether or not moderation is supported.
     */
    _isModerationSupported: boolean;

    /**
     * True if the participant is the local participant.
     */
    _local: boolean;

    /**
     * Whether or not the local participant is moderator.
     */
    _localModerator: boolean;

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean;

    /**
     * Whether or not the participant name matches the search string.
     */
    _matchesSearch: boolean;

    /**
     * The participant.
     */
    _participant?: IParticipant;

    /**
     * The participant ID.
     *
     * NOTE: This ID may be different from participantID prop in the case when we pass undefined for the local
     * participant. In this case the local participant ID will be filled through _participantID prop.
     */
    _participantID: string;

    /**
     * The type of button to be rendered for the quick action.
     */
    _quickActionButtonType: string;

    /**
     * True if the participant have raised hand.
     */
    _raisedHand: boolean;

    /**
     * Media state for video.
     */
    _videoMediaState: MediaState;

    /**
     * The translated ask unmute text for the quick action buttons.
     */
    askUnmuteText: string;

    /**
     * Is this item highlighted.
     */
    isHighlighted: boolean;

    /**
     * Whether or not the local participant is in a breakout room.
     */
    isInBreakoutRoom: boolean;

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function;

    /**
     * The translated text for the mute participant button.
     */
    muteParticipantButtonText: string;

    /**
     * Callback for the activation of this item's context menu.
     */
    onContextMenu: () => void;

    /**
     * Callback for the mouse leaving this item.
     */
    onLeave: (e?: React.MouseEvent) => void;

    /**
     * Callback used to open an actions drawer for a participant.
     */
    openDrawerForParticipant: Function;

    /**
     * True if an overflow drawer should be displayed.
     */
    overflowDrawer: boolean;


    /**
     * The aria-label for the ellipsis action.
     */
    participantActionEllipsisLabel: string;

    /**
     * The ID of the participant.
     */
    participantID?: string;

    /**
     * Callback used to stop a participant's video.
    */
    stopVideo: Function;

    /**
     * The translated "you" text.
     */
    youText: string;
}

/**
 * Implements the MeetingParticipantItem component.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
function MeetingParticipantItem({
    _audioMediaState,
    _audioTrack,
    _disableModeratorIndicator,
    _displayName,
    _local,
    _localVideoOwner,
    _matchesSearch,
    _participant,
    _participantID,
    _quickActionButtonType,
    _raisedHand,
    _videoMediaState,
    isHighlighted,
    isInBreakoutRoom,
    muteAudio,
    onContextMenu,
    onLeave,
    openDrawerForParticipant,
    overflowDrawer,
    participantActionEllipsisLabel,
    stopVideo,
    youText
}: IProps) {

    const [ hasAudioLevels, setHasAudioLevel ] = useState(false);
    const [ registeredEvent, setRegisteredEvent ] = useState(false);

    const _updateAudioLevel = useCallback(level => {
        const audioLevel = typeof level === 'number' && !isNaN(level)
            ? level : 0;

        setHasAudioLevel(audioLevel > 0.009);
    }, []);

    useEffect(() => {
        if (_audioTrack && !registeredEvent) {
            const { jitsiTrack } = _audioTrack;

            if (jitsiTrack) {
                jitsiTrack.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, _updateAudioLevel);
                setRegisteredEvent(true);
            }
        }

        return () => {
            if (_audioTrack && registeredEvent) {
                const { jitsiTrack } = _audioTrack;

                jitsiTrack?.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, _updateAudioLevel);
            }
        };
    }, [ _audioTrack ]);

    if (!_matchesSearch) {
        return null;
    }

    const audioMediaState = _audioMediaState === MEDIA_STATE.UNMUTED && hasAudioLevels
        ? MEDIA_STATE.DOMINANT_SPEAKER : _audioMediaState;

    return (
        <ParticipantItem
            actionsTrigger = { ACTION_TRIGGER.HOVER }
            {
                ...(_participant?.fakeParticipant ? {} : {
                    audioMediaState,
                    videoMediaState: _videoMediaState
                })
            }
            disableModeratorIndicator = { _disableModeratorIndicator }
            displayName = { _displayName }
            isHighlighted = { isHighlighted }
            isModerator = { isParticipantModerator(_participant) }
            local = { _local }
            onLeave = { onLeave }
            openDrawerForParticipant = { openDrawerForParticipant }
            overflowDrawer = { overflowDrawer }
            participantID = { _participantID }
            raisedHand = { _raisedHand }
            youText = { youText }>

            {!overflowDrawer && !_participant?.fakeParticipant
                && <>
                    {!isInBreakoutRoom && (
                        <ParticipantQuickAction
                            buttonType = { _quickActionButtonType }
                            muteAudio = { muteAudio }
                            participantID = { _participantID }
                            participantName = { _displayName }
                            stopVideo = { stopVideo } />
                    )}
                    <ParticipantActionEllipsis
                        accessibilityLabel = { participantActionEllipsisLabel }
                        onClick = { onContextMenu }
                        participantID = { _participantID } />
                </>
            }

            {!overflowDrawer && (_localVideoOwner && _participant?.fakeParticipant) && (
                <ParticipantActionEllipsis
                    accessibilityLabel = { participantActionEllipsisLabel }
                    onClick = { onContextMenu } />
            )}
        </ParticipantItem>
    );
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantID, searchString } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state)?.id;
    const participant = getParticipantByIdOrUndefined(state, participantID);
    const _displayName = getParticipantDisplayName(state, participant?.id ?? '');
    const _matchesSearch = participantMatchesSearch(participant, searchString);
    const _isAudioMuted = getSsrcRewritingFeatureFlag(state)
        ? Boolean(participant && getMutedStateByParticipantAndMediaType(state, participant, MEDIA_TYPE.AUDIO))
        : Boolean(participant && isParticipantAudioMuted(participant, state));
    const _isVideoMuted = getSsrcRewritingFeatureFlag(state)
        ? Boolean(participant && getMutedStateByParticipantAndMediaType(state, participant, MEDIA_TYPE.VIDEO))
        : isParticipantVideoMuted(participant, state);
    const _audioMediaState = getParticipantAudioMediaState(participant, _isAudioMuted, state);
    const _videoMediaState = getParticipantVideoMediaState(participant, _isVideoMuted, state);
    const _quickActionButtonType = getQuickActionButtonType(participant, _isAudioMuted, _isVideoMuted, state);

    const tracks = state['features/base/tracks'];
    const _audioTrack = participantID === localParticipantId
        ? getLocalAudioTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, participantID);

    const { disableModeratorIndicator } = state['features/base/config'];

    return {
        _audioMediaState,
        _audioTrack,
        _disableModeratorIndicator: Boolean(disableModeratorIndicator),
        _displayName,
        _local: Boolean(participant?.local),
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _matchesSearch,
        _participant: participant,
        _participantID: participant?.id ?? '',
        _quickActionButtonType,
        _raisedHand: hasRaisedHand(participant),
        _videoMediaState
    };
}

export default connect(_mapStateToProps)(MeetingParticipantItem);
