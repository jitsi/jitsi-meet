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
    const admit = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, true)), [ dispatch, p.id ]);
    const reject = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, false)), [ dispatch, p.id ]);

    return (
        <ParticipantItem
            displayName = { p.name ?? '' }
            isKnockingParticipant = { true }
            key = { p.id }
            participantID = { p.id } >
            <Button
                accessibilityLabel = 'participantsPane.actions.reject'
                labelKey = 'participantsPane.actions.reject'
                onClick = { reject }
                style = { styles.buttonReject }
                type = { BUTTON_TYPES.DESTRUCTIVE } />
            <Button
                accessibilityLabel = 'participantsPane.actions.admit'
                labelKey = 'participantsPane.actions.admit'
                onClick = { admit }
                style = { styles.buttonAdmit }
                type = { BUTTON_TYPES.PRIMARY } />
        </ParticipantItem>
    );
};
