// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { Icon, IconInviteMore } from '../../../base/icons';
import { getParticipants } from '../../../base/participants';
import { doInvitePeople } from '../../../invite/actions.native';
import { shouldRenderInviteButton } from '../../functions';

import { MeetingParticipantItem } from './MeetingParticipantItem';
import styles from './styles';

export const MeetingParticipantList = () => {
    const dispatch = useDispatch();
    const onInvite = useCallback(() => dispatch(doInvitePeople()), [ dispatch ]);
    const showInviteButton = useSelector(shouldRenderInviteButton);
    const store = useStore();
    const state = store.getState();
    const participants = getParticipants(state);
    const { t } = useTranslation();

    return (
        <View style = { styles.meetingList }>
            <Text style = { styles.meetingListDescription }>
                {t('participantsPane.headings.participantsList',
                    { count: participants.length })}
            </Text>
            {
                showInviteButton
                && <Button
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
            }
            {
                participants.map(p => (
                    <MeetingParticipantItem
                        key = { p.id }
                        participant = { p } />)
                )
            }
        </View>
    );
};
