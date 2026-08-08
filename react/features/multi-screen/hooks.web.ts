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
    getCachedScreenDetails,
    getSecondScreenShowing,
    isSecondScreenEnabled,
    loadScreenDetails,
    notifySecondScreenOpenFailed,
    pickSecondScreenTarget
} from './functions.web';
import logger from './logger';
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

        const send = () => {
            const { id, screenId } = pickSecondScreenTarget(store.getState());

            store.dispatch(setSecondScreen(id, source, screenId));
        };

        // Stay synchronous once the screen details are known, so the window is
        // opened in this click's task and the popup blocker sees it as
        // user-initiated. Only the very first send has to await the permission.
        if (getCachedScreenDetails()) {
            send();
        } else {
            loadScreenDetails()
                .then(send)
                .catch((e: any) => {
                    logger.warn('Could not send to a second screen', e);

                    // No window was opened, so no id exists yet to report
                    // against; the failure paths inside the open cover the rest.
                    notifySecondScreenOpenFailed(
                        store, pickSecondScreenTarget(store.getState()).id, 'window-management-unavailable');
                });
        }
    }, [ activeId, source, store ]);

    return { active: Boolean(activeId),
        onClick,
        visible };
}
