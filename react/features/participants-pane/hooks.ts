import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { handleLobbyChatInitialized } from '../chat/actions.any';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { approveKnockingParticipant, rejectKnockingParticipant } from '../lobby/actions';

interface DrawerParticipant {
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
export function useLobbyActions(participant?: DrawerParticipant | null, closeDrawer?: Function) {
    const dispatch = useDispatch();

    return [
        useCallback(e => {
            e.stopPropagation();
            dispatch(approveKnockingParticipant(participant?.participantID));
            closeDrawer?.();
        }, [ dispatch, closeDrawer ]),

        useCallback(() => {
            dispatch(rejectKnockingParticipant(participant?.participantID));
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
    DrawerParticipant | null,
    () => void,
    (p: DrawerParticipant | null) => void ] {
    const [ drawerParticipant, openDrawerForParticipant ] = useState<DrawerParticipant | null>(null);
    const closeDrawer = useCallback(() => {
        openDrawerForParticipant(null);
    }, []);

    return [
        drawerParticipant,
        closeDrawer,
        openDrawerForParticipant
    ];
}
