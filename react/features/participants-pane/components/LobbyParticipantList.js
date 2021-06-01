// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getLobbyState } from '../../lobby/functions';

import { LobbyParticipantItem } from './LobbyParticipantItem';
import { Heading } from './styled';

export const LobbyParticipantList = () => {
    const {
        lobbyEnabled,
        knockingParticipants: participants
    } = useSelector(getLobbyState);
    const { t } = useTranslation();

    if (!lobbyEnabled || !participants.length) {
        return null;
    }

    return (
    <>
        <Heading>{t('participantsPane.headings.lobby', { count: participants.length })}</Heading>
        <div>
            {participants.map(p => (
                <LobbyParticipantItem
                    key = { p.id }
                    participant = { p } />)
            )}
        </div>
    </>
    );
};
