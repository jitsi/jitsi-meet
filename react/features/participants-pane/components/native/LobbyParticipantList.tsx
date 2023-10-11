import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import Button from '../../../base/ui/components/native/Button';
import { BUTTON_MODES, BUTTON_TYPES } from '../../../base/ui/constants.native';
import { admitMultiple } from '../../../lobby/actions.native';
import { getKnockingParticipants, getLobbyEnabled } from '../../../lobby/functions';

import { LobbyParticipantItem } from './LobbyParticipantItem';
import styles from './styles';

const LobbyParticipantList = () => {
    const dispatch = useDispatch();
    const lobbyEnabled = useSelector(getLobbyEnabled);
    const participants = useSelector(getKnockingParticipants);
    const admitAll = useCallback(() =>
        dispatch(admitMultiple(participants)),
        [ dispatch, participants ]);
    const { t } = useTranslation();
    const title = t('participantsPane.headings.waitingLobby',
        { count: participants.length });

    if (!lobbyEnabled || !participants.length) {
        return null;
    }

    return (
        <>
            <View style = { styles.lobbyListDetails as ViewStyle } >
                <Text style = { styles.lobbyListDescription as TextStyle }>
                    { title }
                </Text>
                {
                    participants.length > 1 && (
                        <Button
                            accessibilityLabel = 'lobby.admitAll'
                            labelKey = 'lobby.admitAll'
                            mode = { BUTTON_MODES.TEXT }
                            onClick = { admitAll }
                            type = { BUTTON_TYPES.PRIMARY } />
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
        </>
    );
};

export default LobbyParticipantList;
