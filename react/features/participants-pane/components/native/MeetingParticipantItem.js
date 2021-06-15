// @flow

import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
    getIsParticipantAudioMuted,
    getIsParticipantVideoMuted
} from '../../../base/tracks';
import { showContextMenuDetails } from '../../actions.native';
import { MediaState } from '../../constants';

import ParticipantItem from './ParticipantItem';


type Props = {

    /**
     * Participant reference
     */
    participant: Object
};

export const MeetingParticipantItem = ({ participant: p }: Props) => {
    const dispatch = useDispatch();
    const isAudioMuted = useSelector(getIsParticipantAudioMuted(p));
    const isVideoMuted = useSelector(getIsParticipantVideoMuted(p));
    const openContextMenuDetails = useCallback(() => dispatch(showContextMenuDetails(p), [ dispatch ]));

    return (
        <ParticipantItem
            audioMuteState = { isAudioMuted ? MediaState.Muted : MediaState.Unmuted }
            isKnockingParticipant = { false }
            name = { p.name }
            onPress = { !p.local && openContextMenuDetails }
            participant = { p }
            videoMuteState = { isVideoMuted ? MediaState.Muted : MediaState.Unmuted } />
    );
};
