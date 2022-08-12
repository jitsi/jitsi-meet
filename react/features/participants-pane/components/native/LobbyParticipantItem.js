// @flow

import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { hasRaisedHand } from '../../../base/participants';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants';
import { approveKnockingParticipant } from '../../../lobby/actions.native';
import { showContextMenuReject } from '../../actions.native';
import { MEDIA_STATE } from '../../constants';

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
    const admit = useCallback(() => dispatch(approveKnockingParticipant(p.id), [ dispatch ]));
    const openContextMenuReject = useCallback(() => dispatch(showContextMenuReject(p), [ dispatch ]));

    return (
        <ParticipantItem
            audioMediaState = { MEDIA_STATE.NONE }
            displayName = { p.name }
            isKnockingParticipant = { true }
            local = { p.local }
            onPress = { openContextMenuReject }
            participant = { p }
            participantID = { p.id }
            raisedHand = { hasRaisedHand(p) }
            videoMediaState = { MEDIA_STATE.NONE }>
            <Button
                accessibilityLabel = 'lobby.admit'
                labelKey = 'lobby.admit'
                onClick = { admit }
                style = { styles.participantActionsButtonAdmit }
                type = { BUTTON_TYPES.PRIMARY } />
        </ParticipantItem>
    );
};
