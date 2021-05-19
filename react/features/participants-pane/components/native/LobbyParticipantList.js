// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { getLobbyState } from '../../../lobby/functions';

import { LobbyParticipantItem } from './LobbyParticipantItem';
import { participants } from './participants';

export const LobbyParticipantList = () => {
    const {
        lobbyEnabled
    } = useSelector(getLobbyState);
    const { t } = useTranslation();

    if (!lobbyEnabled || !participants.length) {
        return null;
    }

    return (
        <>
            <Text>{t('participantsPane.headings.lobby', { count: participants.length })}</Text>
            <View>
                {participants.map(p => (
                    <LobbyParticipantItem
                        key = { p.id }
                        participant = { p } />)
                )}
            </View>
        </>
    );
};
