// @flow

import { setRemoteParticipants } from './actions';

/**
 * Computes the reorderd list of the remote participants.
 *
 * @param {*} store - The redux store.
 * @returns {void}
 * @private
 */
export function updateRemoteParticipants(store: Object) {
    const state = store.getState();
    const { fakeParticipants, sortedRemoteParticipants, speakersList } = state['features/base/participants'];
    const { remoteScreenShares } = state['features/video-layout'];
    const screenShares = (remoteScreenShares || []).slice();
    let speakers = (speakersList || []).slice();
    const remoteParticipants = new Map(sortedRemoteParticipants);
    const sharedVideos = fakeParticipants ? Array.from(fakeParticipants.keys()) : [];

    for (const screenshare of screenShares) {
        remoteParticipants.delete(screenshare);
        speakers = speakers.filter(speaker => speaker !== screenshare);
    }
    for (const sharedVideo of sharedVideos) {
        remoteParticipants.delete(sharedVideo);
        speakers = speakers.filter(speaker => speaker !== sharedVideo);
    }
    for (const speaker of speakers) {
        remoteParticipants.delete(speaker);
    }
    const reorderedParticipants
        = [ ...screenShares.reverse(), ...sharedVideos, ...speakers, ...Array.from(remoteParticipants.keys()) ];

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
