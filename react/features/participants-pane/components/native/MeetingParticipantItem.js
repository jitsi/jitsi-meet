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

export const MeetingParticipantItem = ({ participant: p }: Props) => {
    const isAudioMuted = useSelector(getIsParticipantAudioMuted(p));
    const isVideoMuted = useSelector(getIsParticipantVideoMuted(p));

    return (
        <ParticipantItem
            audioMuteState = { isAudioMuted ? MediaState.Muted : MediaState.Unmuted }
            name = { p.name }
            participant = { p }
            videoMuteState = { isVideoMuted ? MediaState.Muted : MediaState.Unmuted } />
    );
};
