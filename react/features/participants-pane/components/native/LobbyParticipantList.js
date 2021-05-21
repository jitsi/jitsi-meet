// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native-paper';

import { LobbyParticipantItem } from './LobbyParticipantItem';
import { participants } from './participants';
import styles from './styles';

export const LobbyParticipantList = () => {
    const { t } = useTranslation();

    return (
        <>
            {/* eslint-disable-next-line max-len */}
            <Text style = { styles.lobbyListDescription }>
                {t('participantsPane.headings.lobby',
                    { count: participants.length })}
            </Text>
            { participants.map(p => (
                <LobbyParticipantItem
                    key = { p.id }
                    participant = { p } />)
            )}
        </>
    );
};
