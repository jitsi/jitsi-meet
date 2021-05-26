// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { Icon, IconInviteMore } from '../../../base/icons';
import { doInvitePeople } from '../../../invite/actions.native';

import { MeetingParticipantItem } from './MeetingParticipantItem';
import { participants } from './participants';
import styles from './styles';

export const MeetingParticipantList = () => {
    const dispatch = useDispatch();
    const onInvite = useCallback(() => {
        sendAnalytics(createToolbarEvent('invite'));
        dispatch(doInvitePeople());
    }, [ dispatch ]);
    const { t } = useTranslation();

    return (
        <View style = { styles.meetingList }>
            <Text style = { styles.meetingListDescription }>
                {t('participantsPane.headings.participantsList',
                    { count: participants.length })}
            </Text>
            <Button
                children = { t('participantsPane.actions.invite') }
                /* eslint-disable-next-line react/jsx-no-bind */
                icon = { () =>
                    (<Icon
                        size = { 24 }
                        src = { IconInviteMore } />)
                }
                labelStyle = { styles.inviteLabel }
                mode = 'contained'
                onPress = { onInvite }
                style = { styles.inviteButton } />
            { participants.map(p => (
                <MeetingParticipantItem
                    key = { p.id }
                    participant = { p } />)
            )}
        </View>
    );
};
