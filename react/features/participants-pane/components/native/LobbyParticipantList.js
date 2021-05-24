// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { LobbyParticipantItem } from './LobbyParticipantItem';
import { participants } from './participants';
import styles from './styles';

export const LobbyParticipantList = () => {
    const { t } = useTranslation();

    return (
        <View style = { styles.lobbyList }>
            <View style = { styles.lobbyListDetails } >
                <Text style = { styles.lobbyListDescription }>
                    {t('participantsPane.headings.lobby',
                        { count: participants.length })}
                </Text>
                <View style = { styles.lobbyListActions }>
                    <Button
                        labelStyle = { styles.allParticipantActionsButton }
                        mode = 'text'>
                        {t('lobby.admitAll')}
                    </Button>
                    <Button
                        labelStyle = { styles.allParticipantActionsButton }
                        mode = 'text'>
                        {t('lobby.rejectAll')}
                    </Button>
                </View>
            </View>
            { participants.map(p => (
                <LobbyParticipantItem
                    key = { p.id }
                    participant = { p } />)
            )}
        </View>
    );
};
