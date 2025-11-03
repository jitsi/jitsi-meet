import { IReduxState, IStore } from '../app/types';
import { getParticipantById, getVirtualScreenshareParticipantOwnerId } from '../base/participants/functions';

import { setRemoteParticipants } from './actions';
import { isFilmstripScrollVisible } from './functions';

/**
 * Returns an array containing the first `count` items from a set.
 *
 * @param {Set<T>} set - The set from which to take items.
 * @param {number} count - The number of items to take.
 * @returns {T[]} An array containing the taken items.
 * @private
 */
function _takeFirstN<T>(set: Set<T>, count: number): T[] {
    const result: T[] = [];

    for (const item of set) {
        if (result.length >= count) break;
        result.push(item);
    }

    return result;
}

/**
 * Computes the reorderd list of the remote participants.
 *
 * @param {*} store - The redux store.
 * @param {boolean} force - Does not short circuit, the execution, make execute all checks.
 * @param {string} participantId - The endpoint id of the participant that joined the call.
 * @returns {void}
 * @private
 */
export function updateRemoteParticipants(store: IStore, force?: boolean, participantId?: string): void {
    const state = store.getState();
    let reorderedParticipants = [];
    const { sortedRemoteVirtualScreenshareParticipants } = state['features/base/participants'];

    if (!isFilmstripScrollVisible(state) && !sortedRemoteVirtualScreenshareParticipants.size && !force) {
        if (participantId) {
            const { remoteParticipants } = state['features/filmstrip'];

            reorderedParticipants = [ ...remoteParticipants, participantId ];
            store.dispatch(setRemoteParticipants(Array.from(new Set(reorderedParticipants))));
        }

        return;
    }

    const {
        dominantSpeaker,
        fakeParticipants,
        previousSpeakers,
        sortedRemoteParticipants
    } = state['features/base/participants'];
    const { visibleRemoteParticipants } = state['features/filmstrip'];
    const remoteParticipants = new Map(sortedRemoteParticipants);
    const screenShareParticipants = sortedRemoteVirtualScreenshareParticipants
        ? [ ...sortedRemoteVirtualScreenshareParticipants.keys() ] : [];
    const sharedVideos = fakeParticipants ? Array.from(fakeParticipants.keys()) : [];
    const speakers: Set<string> = new Set();
    const dominant = dominantSpeaker ? getParticipantById(state, dominantSpeaker) : undefined;
    const config = state['features/base/config'];
    const defaultRemoteDisplayName = config?.defaultRemoteDisplayName ?? 'Fellow Jitster';

    // Generate the remote active speakers list.
    if (dominant && !dominant.local) {
        speakers.add(dominant.id);
    }
    previousSpeakers.forEach(id => speakers.add(id));

    for (const screenshare of screenShareParticipants) {
        const ownerId = getVirtualScreenshareParticipantOwnerId(screenshare);

        remoteParticipants.delete(ownerId);
        remoteParticipants.delete(screenshare);
        speakers.delete(ownerId);
    }

    for (const sharedVideo of sharedVideos) {
        remoteParticipants.delete(sharedVideo);
    }
    for (const speaker of speakers.keys()) {
        remoteParticipants.delete(speaker);
    }

    // Calculate the number of slots available for active speakers and then sort them alphabetically to ensure
    // consistent order.
    const numberOfActiveSpeakerSlots
        = visibleRemoteParticipants.size - (screenShareParticipants.length * 2) - sharedVideos.length;
    const activeSpeakersDisplayed = _takeFirstN(speakers, numberOfActiveSpeakerSlots)
        .sort((a: string, b: string) => {
            return (getParticipantById(state, a)?.name ?? defaultRemoteDisplayName)
                .localeCompare(getParticipantById(state, b)?.name ?? defaultRemoteDisplayName);
        });

    const participantsWithScreenShare = screenShareParticipants.reduce<string[]>((acc, screenshare) => {
        const ownerId = getVirtualScreenshareParticipantOwnerId(screenshare);

        acc.push(ownerId);
        acc.push(screenshare);

        return acc;
    }, []);

    // Always update the order of the thumbnails.
    reorderedParticipants = [
        ...participantsWithScreenShare,
        ...sharedVideos,
        ...activeSpeakersDisplayed,
        ...Array.from(remoteParticipants.keys())
    ];

    store.dispatch(setRemoteParticipants(Array.from(new Set(reorderedParticipants))));
}

/**
 * Private helper to calculate the reordered list of remote participants when a participant leaves.
 *
 * @param {*} store - The redux store.
 * @param {string} participantId - The endpoint id of the participant leaving the call.
 * @returns {void}
 * @private
 */
export function updateRemoteParticipantsOnLeave(store: IStore, participantId: string | null = null) {
    if (!participantId) {
        return;
    }
    const state = store.getState();
    const { remoteParticipants } = state['features/filmstrip'];
    const reorderedParticipants = new Set(remoteParticipants);

    reorderedParticipants.delete(participantId)
        && store.dispatch(setRemoteParticipants(Array.from(reorderedParticipants)));
}

/**
 * Returns whether tileview is completely disabled.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {boolean} - Whether tileview is completely disabled.
 */
export function isTileViewModeDisabled(state: IReduxState) {
    const { tileView = {} } = state['features/base/config'];

    return tileView.disabled;
}
