import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { approveKnockingParticipant, rejectKnockingParticipant } from '../lobby/actions';

/**
 * Hook used to create admit/reject lobby actions.
 *
 * @param {Object} participant - The participant for which the actions are created.
 * @param {Function} closeDrawer - Callback for closing the drawer.
 * @returns {Object}
 */
export function useLobbyActions(participant, closeDrawer) {
    const dispatch = useDispatch();

    return [
        useCallback(e => {
            e.stopPropagation();
            dispatch(approveKnockingParticipant(participant && participant.participantID));
            closeDrawer && closeDrawer();
        }, [ dispatch, closeDrawer ]),

        useCallback(() => {
            dispatch(rejectKnockingParticipant(participant && participant.participantID));
            closeDrawer && closeDrawer();
        }, [ dispatch, closeDrawer ])
    ];
}

/**
 * Hook used to create actions & state for opening a drawer.
 *
 * @returns {Object}
 */
export function useParticipantDrawer() {
    const [ drawerParticipant, openDrawerForPaticipant ] = useState(null);
    const closeDrawer = useCallback(() => {
        openDrawerForPaticipant(null);
    });

    return [
        drawerParticipant,
        closeDrawer,
        openDrawerForPaticipant
    ];
}
