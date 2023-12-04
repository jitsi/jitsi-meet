import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { approveRequest, denyRequest } from '../../../visitors/actions';
import { IPromotionRequest } from '../../../visitors/types';

import ParticipantItem from './ParticipantItem';
import styles from './styles';

interface IProps {

    /**
     * Promotion request reference.
     */
    request: IPromotionRequest;
}

export const VisitorsItem = ({ request: r }: IProps) => {
    const dispatch = useDispatch();
    const admit = useCallback(() => dispatch(approveRequest(r)), [ dispatch ]);
    const reject = useCallback(() => dispatch(denyRequest(r)), [ dispatch ]);

    return (
        <ParticipantItem
            displayName = { r.nick ?? '' }
            isKnockingParticipant = { true }
            key = { r.from }
            participantID = { r.from } >
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
