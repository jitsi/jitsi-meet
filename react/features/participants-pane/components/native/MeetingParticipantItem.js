// @flow

import React from 'react';
import { useSelector } from 'react-redux';

import {
    getIsParticipantAudioMuted,
    getIsParticipantVideoMuted
} from '../../../base/tracks';
import { MediaState } from '../../constants';

import ParticipantItem from './ParticipantItem';


type Props = {

    /**
     * Participant reference
     */
    participant: Object
};

export const MeetingParticipantItem = ({ participant }: Props) => {
    const isAudioMuted = useSelector(getIsParticipantAudioMuted(participant));
    const isVideoMuted = useSelector(getIsParticipantVideoMuted(participant));

    return (
        <ParticipantItem
            audioMuteState = { isAudioMuted ? MediaState.Muted : MediaState.Unmuted }
            participant = { participant }
            videoMuteState = { isVideoMuted ? MediaState.Muted : MediaState.Unmuted } />
    );
};
