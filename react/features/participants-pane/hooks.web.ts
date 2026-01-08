import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { handleLobbyChatInitialized } from '../chat/actions.web';
import { approveKnockingParticipant, rejectKnockingParticipant } from '../lobby/actions.web';

import ParticipantsPaneButton from './components/web/ParticipantsPaneButton';
import { isParticipantsPaneEnabled } from './functions';

interface IDrawerParticipant {
    displayName?: string;
    participantID: string;
}

const participants = {
    key: 'participants-pane',
    Content: ParticipantsPaneButton,
    group: 2
};

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
        }, [ dispatch, closeDrawer, participant?.participantID ]),

        useCallback(() => {
            dispatch(rejectKnockingParticipant(participant?.participantID ?? ''));
            closeDrawer?.();
        }, [ dispatch, closeDrawer, participant?.participantID ]),

        useCallback(() => {
            dispatch(handleLobbyChatInitialized(participant?.participantID ?? ''));
        }, [ dispatch, participant?.participantID ])
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

/**
 * A hook that returns the participants pane button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useParticipantPaneButton() {
    const participantsPaneEnabled = useSelector(isParticipantsPaneEnabled);

    if (participantsPaneEnabled) {
        return participants;
    }
}
