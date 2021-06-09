// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { getLobbyState } from '../../../lobby/functions';
import { admitAllKnockingParticipants } from '../../../video-menu/actions.any';

import { LobbyParticipantItem } from './LobbyParticipantItem';
import styles from './styles';

export const LobbyParticipantList = () => {
    const {
        lobbyEnabled,
        knockingParticipants: participants
    } = useSelector(getLobbyState);

    const dispatch = useDispatch();
    const admitAll = useCallback(() =>
        dispatch(admitAllKnockingParticipants(participants, lobbyEnabled)),
        [ dispatch ]);
    const { t } = useTranslation();

    if (!lobbyEnabled || !participants.length) {
        return null;
    }

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
            {
                participants.map(p => (
                    <LobbyParticipantItem
                        key = { p.id }
                        participant = { p } />)
                )
            }
        </View>
    );
};
