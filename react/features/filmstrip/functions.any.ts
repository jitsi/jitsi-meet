import { IReduxState, IStore } from '../app/types';
import {
    getActiveSpeakersToBeDisplayed,
    getVirtualScreenshareParticipantOwnerId
} from '../base/participants/functions';

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
        fakeParticipants,
        sortedRemoteParticipants
    } = state['features/base/participants'];
    const remoteParticipants = new Map(sortedRemoteParticipants);
    const screenShareParticipants = sortedRemoteVirtualScreenshareParticipants
        ? [ ...sortedRemoteVirtualScreenshareParticipants.keys() ] : [];
    const sharedVideos = fakeParticipants ? Array.from(fakeParticipants.keys()) : [];
    const speakers = getActiveSpeakersToBeDisplayed(state);

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

    // Always update the order of the thubmnails.
    const participantsWithScreenShare = screenShareParticipants.reduce<string[]>((acc, screenshare) => {
        const ownerId = getVirtualScreenshareParticipantOwnerId(screenshare);

        acc.push(ownerId);
        acc.push(screenshare);

        return acc;
    }, []);

    reorderedParticipants = [
        ...participantsWithScreenShare,
        ...sharedVideos,
        ...Array.from(speakers.keys()),
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
