// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ACTION_TRIGGER, MEDIA_STATE } from '../../constants';
import { useLobbyActions } from '../../hooks';

import ParticipantItem from './ParticipantItem';
import { ParticipantActionButton } from './styled';

type Props = {

    /**
     * If an overflow drawer should be displayed.
     */
    overflowDrawer: boolean,

    /**
     * Callback used to open a drawer with admit/reject actions.
     */
    openDrawerForParticipant: Function,

    /**
     * Participant reference
     */
    participant: Object
};

export const LobbyParticipantItem = ({
    overflowDrawer,
    participant: p,
    openDrawerForParticipant
}: Props) => {
    const { id } = p;
    const [ admit ] = useLobbyActions({ participantID: id });
    const { t } = useTranslation();

    return (
        <ParticipantItem
            actionsTrigger = { ACTION_TRIGGER.PERMANENT }
            audioMediaState = { MEDIA_STATE.NONE }
            displayName = { p.name }
            local = { p.local }
            openDrawerForParticipant = { openDrawerForParticipant }
            overflowDrawer = { overflowDrawer }
            participantID = { id }
            raisedHand = { p.raisedHand }
            videoMediaState = { MEDIA_STATE.NONE }
            youText = { t('chat.you') }>
            <ParticipantActionButton
                onClick = { admit }
                primary = { true }>
                {t('lobby.admit')}
            </ParticipantActionButton>
        </ParticipantItem>
    );
};
