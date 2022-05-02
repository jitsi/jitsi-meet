import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { handleLobbyChatInitialized } from '../chat/actions.any';
import { approveKnockingParticipant, rejectKnockingParticipant } from '../lobby/actions';

/**
 * Hook used to create admit/reject lobby actions.
 *
 * @param {Object} participant - The participant for which the actions are created.
 * @param {Function} closeDrawer - Callback for closing the drawer.
 * @returns {Array<Function>}
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
        }, [ dispatch, closeDrawer ]),

        useCallback(() => {
            dispatch(handleLobbyChatInitialized(participant && participant.participantID));
        }, [ dispatch ])
    ];
}

/**
 * Hook used to create actions & state for opening a drawer.
 *
 * @returns {Array<any>}
 */
export function useParticipantDrawer() {
    const [ drawerParticipant, openDrawerForParticipant ] = useState(null);
    const closeDrawer = useCallback(() => {
        openDrawerForParticipant(null);
    });

    return [
        drawerParticipant,
        closeDrawer,
        openDrawerForParticipant
    ];
}
