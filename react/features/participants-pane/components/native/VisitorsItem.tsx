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
    const admit = useCallback(() => dispatch(approveRequest(r)), [ dispatch, r ]);
    const reject = useCallback(() => dispatch(denyRequest(r)), [ dispatch, r ]);
    const { from, nick } = r;

    return (
        <ParticipantItem
            displayName = { nick ?? '' }
            isKnockingParticipant = { true }
            key = { from }
            participantID = { from } >
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
