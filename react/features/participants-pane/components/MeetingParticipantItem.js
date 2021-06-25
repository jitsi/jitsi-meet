// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getIsParticipantAudioMuted, getIsParticipantVideoMuted } from '../../base/tracks';
import { ACTION_TRIGGER, MEDIA_STATE } from '../constants';
import { getParticipantAudioMediaState } from '../functions';

import { ParticipantItem } from './ParticipantItem';
import ParticipantQuickAction from './ParticipantQuickAction';
import { ParticipantActionEllipsis } from './styled';

type Props = {

    /**
     * Is this item highlighted
     */
    isHighlighted: boolean,

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

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
    muteAudio,
    participant
}: Props) => {
    const { t } = useTranslation();
    const isAudioMuted = useSelector(getIsParticipantAudioMuted(participant));
    const isVideoMuted = useSelector(getIsParticipantVideoMuted(participant));
    const audioMediaState = useSelector(getParticipantAudioMediaState(participant, isAudioMuted));

    return (
        <ParticipantItem
            actionsTrigger = { ACTION_TRIGGER.HOVER }
            audioMediaState = { audioMediaState }
            isHighlighted = { isHighlighted }
            onLeave = { onLeave }
            participant = { participant }
            videoMuteState = { isVideoMuted ? MEDIA_STATE.MUTED : MEDIA_STATE.UNMUTED }>
            <ParticipantQuickAction
                isAudioMuted = { isAudioMuted }
                muteAudio = { muteAudio }
                participant = { participant } />
            <ParticipantActionEllipsis
                aria-label = { t('MeetingParticipantItem.ParticipantActionEllipsis.options') }
                onClick = { onContextMenu } />
        </ParticipantItem>
    );
};
