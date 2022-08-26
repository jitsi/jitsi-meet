// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants';
import { admitMultiple } from '../../../lobby/actions.native';
import { getKnockingParticipants, getLobbyEnabled } from '../../../lobby/functions';

import CollapsibleList from './CollapsibleList';
import { LobbyParticipantItem } from './LobbyParticipantItem';
import styles from './styles';


const LobbyParticipantList = () => {
    const lobbyEnabled = useSelector(getLobbyEnabled);
    const participants = useSelector(getKnockingParticipants);

    const dispatch = useDispatch();
    const admitAll = useCallback(() =>
        dispatch(admitMultiple(participants)),
        [ dispatch, participants ]);
    const { t } = useTranslation();

    if (!lobbyEnabled || !participants.length) {
        return null;
    }

    const title = (
        <View style = { styles.lobbyListDetails } >
            <Text style = { styles.lobbyListDescription }>
                {t('participantsPane.headings.waitingLobby',
                        { count: participants.length })}
            </Text>
            {
                participants.length > 1 && (
                    <Button
                        accessibilityLabel = 'lobby.admitAll'
                        labelKey = 'lobby.admitAll'
                        labelStyle = { styles.admitAllButtonLabel }
                        onClick = { admitAll }
                        type = { BUTTON_TYPES.TERTIARY } />
                )
            }
        </View>
    );

    return (
        <CollapsibleList
            title = { title }>
            {
                participants.map(p => (
                    <LobbyParticipantItem
                        key = { p.id }
                        participant = { p } />)
                )
            }
        </CollapsibleList>
    );
};

export default LobbyParticipantList;
