// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { Button, withTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { admitMultiple } from '../../../lobby/actions.native';
import { getKnockingParticipants, getLobbyEnabled } from '../../../lobby/functions';

import CollapsibleList from './CollapsibleList';
import { LobbyParticipantItem } from './LobbyParticipantItem';
import styles from './styles';

type Props = {

    /**
     * Theme used for styles.
     */
    theme: Object
};

const LobbyParticipantList = ({ theme }: Props) => {
    const lobbyEnabled = useSelector(getLobbyEnabled);
    const participants = useSelector(getKnockingParticipants);

    const dispatch = useDispatch();
    const admitAll = useCallback(() =>
        dispatch(admitMultiple(participants)),
        [ dispatch, participants ]);
    const { t } = useTranslation();
    const { palette } = theme;

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
                        color = { palette.action02 }
                        labelStyle = { styles.admitAllParticipantsActionButtonLabel }
                        mode = 'text'
                        onPress = { admitAll }>
                        {t('lobby.admitAll')}
                    </Button>
                )
            }
        </View>
    );

    // Regarding the fact that we have 3 sections, we apply
    // a certain height percentage for every section in order for all to fit
    // inside the participants pane container
    const style = participants.length > 1 && styles.lobbyListContent;

    return (
        <CollapsibleList
            title = { title }>
            <ScrollView
                bounces = { false }
                style = { style } >
                {
                    participants.map(p => (
                        <LobbyParticipantItem
                            key = { p.id }
                            participant = { p } />)
                    )
                }
            </ScrollView>
        </CollapsibleList>
    );
};

export default withTheme(LobbyParticipantList);
