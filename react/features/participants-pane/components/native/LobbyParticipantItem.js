import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { setKnockingParticipantApproval } from '../../../lobby/actions.native';

import ParticipantItem from './ParticipantItem';
import styles from './styles';


type Props = {

    /**
     * Participant reference.
     */
    participant: Object
};

export const LobbyParticipantItem = ({ participant: p }: Props) => {
    const dispatch = useDispatch();
    const admit = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, true), [ dispatch ]));
    const reject = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, false), [ dispatch ]));

    return (
        <ParticipantItem
            displayName = { p.name }
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
