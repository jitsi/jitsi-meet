import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { handleLobbyChatInitialized } from '../chat/actions.web';
import { approveKnockingParticipant, rejectKnockingParticipant } from '../lobby/actions.web';

interface IDrawerParticipant {
    displayName?: string;
    participantID: string;
}

/**
 * Hook used to create admit/reject lobby actions.
 *
 * @param {Object} participant - The participant for which the actions are created.
 * @param {Function} closeDrawer - Callback for closing the drawer.
 * @returns {Array<Function>}
 */
export function useLobbyActions(participant?: IDrawerParticipant | null, closeDrawer?: Function) {
    const dispatch = useDispatch();

    return [
        useCallback(e => {
            e.stopPropagation();
            dispatch(approveKnockingParticipant(participant?.participantID ?? ''));
            closeDrawer?.();
        }, [ dispatch, closeDrawer ]),

        useCallback(() => {
            dispatch(rejectKnockingParticipant(participant?.participantID ?? ''));
            closeDrawer?.();
        }, [ dispatch, closeDrawer ]),

        useCallback(() => {
            dispatch(handleLobbyChatInitialized(participant?.participantID ?? ''));
        }, [ dispatch ])
    ];
}

/**
 * Hook used to create actions & state for opening a drawer.
 *
 * @returns {Array<any>}
 */
export function useParticipantDrawer(): [
    IDrawerParticipant | null,
    () => void,
    (p: IDrawerParticipant | null) => void ] {
    const [ drawerParticipant, openDrawerForParticipant ] = useState<IDrawerParticipant | null>(null);
    const closeDrawer = useCallback(() => {
        openDrawerForParticipant(null);
    }, []);

    return [
        drawerParticipant,
        closeDrawer,
        openDrawerForParticipant
    ];
}
