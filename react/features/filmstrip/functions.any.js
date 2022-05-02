// @flow

import { getSourceNameSignalingFeatureFlag } from '../base/config';
import { getVirtualScreenshareParticipantOwnerId } from '../base/participants';

import { setRemoteParticipants } from './actions';
import { isReorderingEnabled } from './functions';

/**
 * Computes the reorderd list of the remote participants.
 *
 * @param {*} store - The redux store.
 * @param {string} participantId - The endpoint id of the participant that joined the call.
 * @returns {void}
 * @private
 */
export function updateRemoteParticipants(store: Object, participantId: ?number) {
    const state = store.getState();
    let reorderedParticipants = [];

    const { sortedRemoteVirtualScreenshareParticipants } = state['features/base/participants'];

    if (!isReorderingEnabled(state) && !sortedRemoteVirtualScreenshareParticipants.size) {
        if (participantId) {
            const { remoteParticipants } = state['features/filmstrip'];

            reorderedParticipants = [ ...remoteParticipants, participantId ];
            store.dispatch(setRemoteParticipants(reorderedParticipants));
        }

        return;
    }

    const {
        fakeParticipants,
        sortedRemoteParticipants,
        sortedRemoteScreenshares,
        speakersList
    } = state['features/base/participants'];
    const remoteParticipants = new Map(sortedRemoteParticipants);
    const screenShares = new Map(sortedRemoteScreenshares);
    const screenShareParticipants = sortedRemoteVirtualScreenshareParticipants
        ? [ ...sortedRemoteVirtualScreenshareParticipants.keys() ] : [];
    const sharedVideos = fakeParticipants ? Array.from(fakeParticipants.keys()) : [];
    const speakers = new Map(speakersList);

    if (getSourceNameSignalingFeatureFlag(state)) {
        for (const screenshare of screenShareParticipants) {
            const ownerId = getVirtualScreenshareParticipantOwnerId(screenshare);

            remoteParticipants.delete(ownerId);
            remoteParticipants.delete(screenshare);

            speakers.delete(ownerId);
            speakers.delete(screenshare);
        }
    } else {
        for (const screenshare of screenShares.keys()) {
            remoteParticipants.delete(screenshare);
            speakers.delete(screenshare);
        }
    }

    for (const sharedVideo of sharedVideos) {
        remoteParticipants.delete(sharedVideo);
        speakers.delete(sharedVideo);
    }
    for (const speaker of speakers.keys()) {
        remoteParticipants.delete(speaker);
    }

    if (getSourceNameSignalingFeatureFlag(state)) {
        // Always update the order of the thumnails.
        const participantsWithScreenShare = screenShareParticipants.reduce((acc, screenshare) => {
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
    } else {
        // Always update the order of the thumnails.
        reorderedParticipants = [
            ...Array.from(screenShares.keys()),
            ...sharedVideos,
            ...Array.from(speakers.keys()),
            ...Array.from(remoteParticipants.keys())
        ];
    }

    store.dispatch(setRemoteParticipants(reorderedParticipants));
}

/**
 * Private helper to calculate the reordered list of remote participants when a participant leaves.
 *
 * @param {*} store - The redux store.
 * @param {string} participantId - The endpoint id of the participant leaving the call.
 * @returns {void}
 * @private
 */
export function updateRemoteParticipantsOnLeave(store: Object, participantId: ?string = null) {
    if (!participantId) {
        return;
    }
    const state = store.getState();
    const { remoteParticipants } = state['features/filmstrip'];
    const reorderedParticipants = new Set(remoteParticipants);

    reorderedParticipants.delete(participantId)
        && store.dispatch(setRemoteParticipants(Array.from(reorderedParticipants)));
}
