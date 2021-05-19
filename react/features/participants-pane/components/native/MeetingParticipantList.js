// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { getParticipants } from '../../../base/participants';

import { MeetingParticipantItem } from './MeetingParticipantItem';
import styles from './styles';


export const MeetingParticipantList = () => {
    const participants = useSelector(getParticipants);
    const { t } = useTranslation();

    return (
        <View style = { styles.lobbyListContainer }>
            <Text>
                {
                    t('participantsPane.headings.participantsList',
                    { count: participants.length }
                    )
                }
            </Text>
            {
                participants.map(p => (
                    <MeetingParticipantItem
                        key = { p.id }
                        participant = { p } />)
                )}
        </View>
    );
};
