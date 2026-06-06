import { IReduxState, IStore } from '../app/types';
import { getParticipantById, getVirtualScreenshareParticipantOwnerId } from '../base/participants/functions';

import { setRemoteParticipants } from './actions';
import { isFilmstripScrollVisible } from './functions';

/**
 * Computes the reorderd list of the remote participants.
 *
 * @param {*} store - The redux store.
 * @param {boolean} force - Does not short circuit, the execution, make execute all checks.
 * @param {string} participantId - The endpoint id of the participant that joined the call.
 * @returns {void}
 * @private
 */
export function updateRemoteParticipants(store: IStore, force?: boolean, participantId?: string) {
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
        activeSpeakers,
        dominantSpeaker,
        fakeParticipants,
        sortedRemoteParticipants
    } = state['features/base/participants'];
    const config = state['features/base/config'];
    const defaultRemoteDisplayName = config?.defaultRemoteDisplayName ?? 'Fellow Jitster';
    const dominant = dominantSpeaker ? getParticipantById(state, dominantSpeaker) : undefined;
    let dominantSpeakerSlot = 0;
    const previousSpeakers = new Set(activeSpeakers);
    const remoteParticipants = new Map(sortedRemoteParticipants);
    const screenShareParticipants = sortedRemoteVirtualScreenshareParticipants
        ? [ ...sortedRemoteVirtualScreenshareParticipants.keys() ] : [];
    const sharedVideos = fakeParticipants ? Array.from(fakeParticipants.keys()) : [];
    const speakers = new Array<string>();
    const { fullyVisibleRemoteParticipantsCount } = state['features/filmstrip'];

    const participantsWithScreenShare = screenShareParticipants.reduce<string[]>((acc, screenshare) => {
        const ownerId = getVirtualScreenshareParticipantOwnerId(screenshare);

        acc.push(ownerId);
        acc.push(screenshare);
        remoteParticipants.delete(ownerId);
        remoteParticipants.delete(screenshare);
        previousSpeakers.delete(ownerId);

        return acc;
    }, []);

    for (const sharedVideo of sharedVideos) {
        remoteParticipants.delete(sharedVideo);
    }

    if (dominant && !dominant.local && participantsWithScreenShare.indexOf(dominant.id) === -1) {
        dominantSpeakerSlot = 1;
        remoteParticipants.delete(dominant.id);
        speakers.push(dominant.id);
    }

    // Find the number of slots available for speakers. Use fullyVisibleRemoteParticipantsCount to exclude partially
    // visible tiles, ensuring dominant speaker is placed on a fully visible tile.
    const slotsForSpeakers
        = fullyVisibleRemoteParticipantsCount
        - (screenShareParticipants.length * 2)
        - sharedVideos.length
        - dominantSpeakerSlot;

    // Construct the list of speakers to be shown.
    if (slotsForSpeakers > 0) {
        Array.from(previousSpeakers).slice(0, slotsForSpeakers).forEach((speakerId: string) => {
            speakers.push(speakerId);
            remoteParticipants.delete(speakerId);
        });
        speakers.sort((a: string, b: string) => {
            return (getParticipantById(state, a)?.name ?? defaultRemoteDisplayName)
                .localeCompare(getParticipantById(state, b)?.name ?? defaultRemoteDisplayName);
        });
    }

    // Always update the order of the thumbnails.
    reorderedParticipants = [
        ...participantsWithScreenShare,
        ...sharedVideos,
        ...speakers,
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

/**
 * Calculates the count of fully visible participants, excluding any partially visible tiles.
 * This respects the actual rendered items from the list component while accounting for
 * container padding/gaps.
 *
 * @param {number} visibleStartIndex - The start index of visible items.
 * @param {number} visibleEndIndex - The end index of visible items.
 * @param {number} containerSize - The width or height of the filmstrip container.
 * @param {number} itemSize - The width or height of each item including margin.
 * @returns {number} - The count of fully visible participants (at least 1).
 */
export function calculateFullyVisibleParticipantsCount(
        visibleStartIndex: number,
        visibleEndIndex: number,
        containerSize: number,
        itemSize: number
): number {
    // Current visible count from the list component (includes any partially visible tile)
    const currentVisibleCount = visibleEndIndex - visibleStartIndex + 1;

    // Theoretical max that can fit fully in the container
    const maxFullyVisible = Math.floor(containerSize / itemSize);

    // Fully visible count is the minimum of actual visible and max that can fit fully
    // Ensure at least 1 if there are any visible items
    return Math.max(1, Math.min(currentVisibleCount, maxFullyVisible));
}
