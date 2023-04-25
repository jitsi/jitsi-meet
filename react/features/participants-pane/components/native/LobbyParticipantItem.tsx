import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { IParticipant } from '../../../base/participants/types';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { setKnockingParticipantApproval } from '../../../lobby/actions.native';

import ParticipantItem from './ParticipantItem';
import styles from './styles';

interface IProps {

    /**
     * Participant reference.
     */
    participant: IParticipant;
}

export const LobbyParticipantItem = ({ participant: p }: IProps) => {
    const dispatch = useDispatch();
    const admit = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, true)), [ dispatch ]);
    const reject = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, false)), [ dispatch ]);

    return (
        <ParticipantItem
            displayName = { p.name ?? '' }
            isKnockingParticipant = { true }
            key = { p.id }
            participantID = { p.id } >
            <Button
                accessibilityLabel = 'lobby.reject'
                labelKey = 'lobby.reject'
                onClick = { reject }
                style = { styles.lobbyButtonReject }
                type = { BUTTON_TYPES.DESTRUCTIVE } />
            <Button
                accessibilityLabel = 'lobby.admit'
                labelKey = 'lobby.admit'
                onClick = { admit }
                style = { styles.lobbyButtonAdmit }
                type = { BUTTON_TYPES.PRIMARY } />
        </ParticipantItem>
    );
};
