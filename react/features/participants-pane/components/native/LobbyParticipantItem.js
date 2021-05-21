// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { setKnockingParticipantApproval } from '../../../lobby/actions.native';
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
    const reject = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, false), [ dispatch ]));
    const { t } = useTranslation();

    return (
        <ParticipantItem
            audioMuteState = { MediaState.Muted }
            participant = { p }
            videoMuteState = { MediaState.ForceMuted }>
            <Button
                labelStyle = { styles.participantActionButtonText }
                mode = 'contained'
                onPress = { admit }
                style = { styles.participantActionButton }>
                {t('lobby.admit')}
            </Button>
            <Button
                labelStyle = { styles.participantActionButtonText }
                mode = 'contained'
                onPress = { reject }
                style = { styles.participantActionButton }>
                {t('lobby.reject')}
            </Button>
        </ParticipantItem>
    );
};
