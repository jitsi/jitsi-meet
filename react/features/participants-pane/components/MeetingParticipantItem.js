// @flow

import React from 'react';
import { useSelector } from 'react-redux';

import { getIsParticipantAudioMuted, getIsParticipantVideoMuted } from '../../base/tracks';
import { ActionTrigger, MediaState } from '../constants';

import { ParticipantItem } from './ParticipantItem';
import { ParticipantActionEllipsis } from './styled';

type Props = {

    /**
     * Is this item highlighted
     */
    isHighlighted: boolean,

    /**
     * Callback for the activation of this item's context menu
     */
    onContextMenu: Function,

    /**
     * Callback for the mouse leaving this item
     */
    onLeave: Function,

    /**
     * Participant reference
     */
    participant: Object
};

export const MeetingParticipantItem = ({
    isHighlighted,
    onContextMenu,
    onLeave,
    participant
}: Props) => {
    const isAudioMuted = useSelector(getIsParticipantAudioMuted(participant));
    const isVideoMuted = useSelector(getIsParticipantVideoMuted(participant));

    return (
        <ParticipantItem
            actionsTrigger = { ActionTrigger.Hover }
            audioMuteState = { isAudioMuted ? MediaState.Muted : MediaState.Unmuted }
            isHighlighted = { isHighlighted }
            onLeave = { onLeave }
            participant = { participant }
            videoMuteState = { isVideoMuted ? MediaState.Muted : MediaState.Unmuted }>
            <ParticipantActionEllipsis onClick = { onContextMenu } />
        </ParticipantItem>
    );
};
