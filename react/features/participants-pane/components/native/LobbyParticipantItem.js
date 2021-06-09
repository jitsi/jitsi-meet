// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { setKnockingParticipantApproval } from '../../../lobby/actions.native';
import { showContextMenuReject } from '../../actions.native';
import { MediaState } from '../../constants';

import ParticipantItem from './ParticipantItem';
import styles from './styles';

type Props = {

    /**
     * Participant reference
     */
    participant: Object
};

export const LobbyParticipantItem = ({ participant: p }: Props) => {
    const dispatch = useDispatch();
    const admit = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, true), [ dispatch ]));
    const openContextMenuReject = useCallback(() => dispatch(showContextMenuReject(p), [ dispatch ]));
    const { t } = useTranslation();

    return (
        <ParticipantItem
            audioMuteState = { MediaState.Muted }
            isKnockingParticipant = { true }
            name = { p.name }
            onPress = { openContextMenuReject }
            participant = { p }
            videoMuteState = { MediaState.ForceMuted }>
            <Button
                children = { t('lobby.admit') }
                contentStyle = { styles.participantActionsButtonContent }
                labelStyle = { styles.participantActionsButtonText }
                mode = 'contained'
                onPress = { admit }
                style = { styles.participantActionsButtonAdmit } />
        </ParticipantItem>
    );
};
