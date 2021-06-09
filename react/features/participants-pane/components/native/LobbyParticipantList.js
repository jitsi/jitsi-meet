// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { admitAllKnockingParticipants } from '../../../video-menu/actions.any';

import { LobbyParticipantItem } from './LobbyParticipantItem';
import { participants } from './participants';
import styles from './styles';

export const LobbyParticipantList = () => {
    const dispatch = useDispatch();
    const admitAll = useCallback(() => dispatch(admitAllKnockingParticipants()), [ dispatch ]);
    const { t } = useTranslation();

    return (
        <View style = { styles.lobbyList }>
            <View style = { styles.lobbyListDetails } >
                <Text style = { styles.lobbyListDescription }>
                    {t('participantsPane.headings.waitingLobby',
                        { count: participants.length })}
                </Text>
                <Button
                    color = '#3D3D3D'
                    labelStyle = { styles.admitAllParticipantsActionButtonLabel }
                    mode = 'text'
                    onPress = { admitAll }
                    style = { styles.admitAllParticipantsActionButton }>
                    {t('lobby.admitAll')}
                </Button>
            </View>
            { participants.map(p => (
                <LobbyParticipantItem
                    key = { p.id }
                    participant = { p } />)
            )}
        </View>
    );
};
