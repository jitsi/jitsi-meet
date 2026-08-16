import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';
import {
    getDominantSpeakerParticipant,
    getLocalParticipant,
    getLocalScreenShareParticipant
} from '../base/participants/functions';

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
