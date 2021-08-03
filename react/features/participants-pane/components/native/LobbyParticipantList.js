// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button, withTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { admitMultiple } from '../../../lobby/actions.native';
import { getLobbyState } from '../../../lobby/functions';

import { LobbyParticipantItem } from './LobbyParticipantItem';
import styles from './styles';

type Props = {

    /**
     * Theme used for styles.
     */
    theme: Object
};

const LobbyParticipantList = ({ theme }: Props) => {
    const {
        lobbyEnabled,
        knockingParticipants: participants
    } = useSelector(getLobbyState);
    const dispatch = useDispatch();
    const admitAll = useCallback(() =>
        dispatch(admitMultiple(participants)),
        [ dispatch, participants ]);
    const { t } = useTranslation();
    const { palette } = theme;

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
                {
                    participants.length > 1 && (
                        <Button
                            color = { palette.action02 }
                            labelStyle = { styles.admitAllParticipantsActionButtonLabel }
                            mode = 'text'
                            onPress = { admitAll }>
                            {t('lobby.admitAll')}
                        </Button>
                    )
                }
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

export default withTheme(LobbyParticipantList);
