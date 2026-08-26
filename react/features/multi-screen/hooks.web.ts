import { useCallback, useMemo } from 'react';
import { useSelector, useStore } from 'react-redux';

import { IReduxState } from '../app/types';
import {
    getDominantSpeakerParticipant,
    getLocalParticipant,
    getLocalScreenShareParticipant
} from '../base/participants/functions';

import { removeSecondScreen, setSecondScreen } from './actions.web';
import {
    getSecondScreenShowing,
    isSecondScreenEnabled,
    pickSecondScreenTarget
} from './functions.web';
import { ISecondScreenSource } from './types';

/**
 * Returns the ordered participant ids for a second-screen layout: the local
 * participant first, then your own shared screen (a virtual participant) when
 * sharing, then the remote participants. Mirrors the main filmstrip ordering.
 *
 * The remote ids come from the filmstrip's {@code remoteParticipants} array,
 * which is reassigned immutably on join/leave (the base participants map is
 * mutated in place, so selecting it directly would not re-render on membership
 * changes).
 *
 * @returns {string[]}
 */
export function useSecondScreenParticipantIds(): string[] {
    const localId = useSelector((state: IReduxState) => getLocalParticipant(state)?.id);
    const localScreenShareId = useSelector((state: IReduxState) => getLocalScreenShareParticipant(state)?.id);
    const remoteParticipantIds = useSelector((state: IReduxState) => state['features/filmstrip'].remoteParticipants);

    return useMemo(() => {
        const ids: string[] = [];

        if (localId) {
            ids.push(localId);
        }
        if (localScreenShareId) {
            ids.push(localScreenShareId);
        }

        return ids.concat(remoteParticipantIds);
    }, [ localId, localScreenShareId, remoteParticipantIds ]);
}

/**
 * Returns the id of the conference dominant speaker, or {@code null}. Drives the
 * speaking ring on the second-screen tiles.
 *
 * @returns {string | null}
 */
export function useDominantSpeakerId(): string | null {
    return useSelector((state: IReduxState) => getDominantSpeakerParticipant(state)?.id ?? null);
}

/**
 * Backs the in-app "send to second screen" triggers: whether to show one,
 * whether the source is already on a screen, and the handler that toggles it.
 * The handler dispatches {@code setSecondScreen}, the same action the external
 * API dispatches, so the API stays the single control plane;
 * {@link pickSecondScreenTarget} chooses which window it lands on.
 *
 * The trigger is shown whenever the feature is enabled and the browser can
 * place a window on another screen, without checking that a second monitor is
 * actually attached: that answer needs the window-management permission, and
 * the click itself is what should ask for it. With no second monitor the window
 * opens on the current screen.
 *
 * @param {ISecondScreenSource} source - What to send.
 * @returns {Object} Whether the trigger is visible, whether its source is
 * already on a second screen, and its click handler.
 */
export function useSendToSecondScreen(source: ISecondScreenSource): {
    active: boolean; onClick: () => void; visible: boolean;
} {
    const store = useStore<IReduxState>();
    const visible = useSelector(isSecondScreenEnabled);
    const activeId = useSelector((state: IReduxState) => getSecondScreenShowing(state, source));

    const onClick = useCallback(() => {

        // Already on a screen: the trigger turns it off again. This is the only
        // way to close an in-app second screen from the meeting window, short of
        // closing the popup by hand on the other display.
        if (activeId) {
            store.dispatch(removeSecondScreen(activeId));

            return;
        }

        // Dispatch synchronously, always. window.open has to run in this click's
        // own task for the popup blocker to see it as user-initiated, and on a
        // profile that has not granted window-management yet, obtaining the
        // screen details here would spend that activation waiting on a
        // permission prompt: Chromium expires it after 5s and the prompt sits
        // until the user answers it. The open asks for the permission itself and
        // places the window once it has an answer (see openSecondScreenWindow),
        // which is also why the target picked here has no screen index on that
        // first send: without the details there are no screens to choose between,
        // and the open puts it on the first external one.
        const { id, screenId } = pickSecondScreenTarget(store.getState());

        store.dispatch(setSecondScreen(id, source, screenId));
    }, [ activeId, source, store ]);

    return { active: Boolean(activeId),
        onClick,
        visible };
}
