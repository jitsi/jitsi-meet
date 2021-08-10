// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { approveKnockingParticipant, rejectKnockingParticipant } from '../../../lobby/actions';
import { ACTION_TRIGGER, MEDIA_STATE } from '../../constants';

import ParticipantItem from './ParticipantItem';
import { ParticipantActionButton } from './styled';

type Props = {

    /**
     * Participant reference
     */
    participant: Object
};

export const LobbyParticipantItem = ({ participant: p }: Props) => {
    const dispatch = useDispatch();
    const admit = useCallback(() => dispatch(approveKnockingParticipant(p.id), [ dispatch ]));
    const reject = useCallback(() => dispatch(rejectKnockingParticipant(p.id), [ dispatch ]));
    const { t } = useTranslation();

    return (
        <ParticipantItem
            actionsTrigger = { ACTION_TRIGGER.PERMANENT }
            audioMediaState = { MEDIA_STATE.NONE }
            displayName = { p.name }
            local = { p.local }
            participantID = { p.id }
            raisedHand = { p.raisedHand }
            videoMuteState = { MEDIA_STATE.NONE }
            youText = { t('chat.you') }>
            <ParticipantActionButton
                onClick = { reject }>
                {t('lobby.reject')}
            </ParticipantActionButton>
            <ParticipantActionButton
                onClick = { admit }
                primary = { true }>
                {t('lobby.admit')}
            </ParticipantActionButton>
        </ParticipantItem>
    );
};
