// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { approveKnockingParticipant } from '../../../lobby/actions.native';
import { showContextMenuReject } from '../../actions.native';
import { MEDIA_STATE } from '../../constants';

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
    const admit = useCallback(() => dispatch(approveKnockingParticipant(p.id), [ dispatch ]));
    const openContextMenuReject = useCallback(() => dispatch(showContextMenuReject(p), [ dispatch ]));
    const { t } = useTranslation();

    return (
        <ParticipantItem
            audioMediaState = { MEDIA_STATE.NONE }
            displayName = { p.name }
            isKnockingParticipant = { true }
            local = { p.local }
            onPress = { openContextMenuReject }
            participant = { p }
            participantID = { p.id }
            raisedHand = { p.raisedHand }
            videoMediaState = { MEDIA_STATE.NONE }>
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
