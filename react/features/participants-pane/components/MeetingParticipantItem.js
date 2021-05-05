// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { openDialog } from '../../base/dialog';
import { getIsParticipantAudioMuted, getIsParticipantVideoMuted } from '../../base/tracks';
import { addModeratedAudioException } from '../../moderated-audio/actions';
import { getIsEnabled, getIsParticipantException } from '../../moderated-audio/functions';
import MuteRemoteParticipantDialog from '../../video-menu/components/web/MuteRemoteParticipantDialog';
import { ActionTrigger, MediaState } from '../constants';

import { ParticipantItem } from './ParticipantItem';
import { ParticipantActionButton, ParticipantActionEllipsis } from './styled';

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
    const dispatch = useDispatch();
    const isAudioModerationEnabled = useSelector(getIsEnabled);
    const isAudioMuted = useSelector(getIsParticipantAudioMuted(participant));
    const isException = useSelector(getIsParticipantException(participant));
    const isVideoMuted = useSelector(getIsParticipantVideoMuted(participant));
    const { t } = useTranslation();

    const audioMuteState = isAudioMuted
        ? isAudioModerationEnabled
            ? isException
                ? MediaState.Muted
                : MediaState.ForceMuted
            : MediaState.Muted
        : MediaState.Unmuted;

    const addException = useCallback(() => {
        dispatch(addModeratedAudioException(participant.id));
    }, [ dispatch ]);

    const mute = useCallback(() => {
        dispatch(openDialog(MuteRemoteParticipantDialog, {
            participantID: participant.id
        }));
    }, [ dispatch, participant ]);

    return (
        <ParticipantItem
            actionsTrigger = { ActionTrigger.Hover }
            audioMuteState = { audioMuteState }
            isHighlighted = { isHighlighted }
            onLeave = { onLeave }
            participant = { participant }
            videoMuteState = { isVideoMuted ? MediaState.Muted : MediaState.Unmuted }>
            {isAudioMuted
                ? isAudioModerationEnabled && !isException && (
                    <ParticipantActionButton
                        onClick = { addException }
                        primary = { true }>
                        {t('participantsPane.actions.askUnmute')}
                    </ParticipantActionButton>
                )
                : (
                    <ParticipantActionButton
                        onClick = { mute }
                        primary = { true }>
                        {t('videothumbnail.domute')}
                    </ParticipantActionButton>
                )}
            <ParticipantActionEllipsis onClick = { onContextMenu } />
        </ParticipantItem>
    );
};
