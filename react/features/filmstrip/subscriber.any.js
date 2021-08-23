// @flow

import { StateListenerRegistry } from '../base/redux';

import { updateRemoteParticipants } from './functions';

/**
 * Listens for changes to the screensharing status of the remote participants to recompute the reordered list of the
 * remote endpoints.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-layout'].remoteScreenShares,
    /* listener */ (remoteScreenShares, store) => updateRemoteParticipants(store));

/**
 * Listens for changes to the dominant speaker to recompute the reordered list of the remote endpoints.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].dominantSpeaker,
    /* listener */ (dominantSpeaker, store) => _reorderDominantSpeakers(store));

/**
 * Private helper function that reorders the remote participants based on dominant speaker changes.
 *
 * @param {*} store - The redux store.
 * @returns {void}
 * @private
 */
function _reorderDominantSpeakers(store) {
    const state = store.getState();
    const { dominantSpeaker, local } = state['features/base/participants'];
    const { visibleRemoteParticipants } = state['features/filmstrip'];

    // Reorder the participants if the new dominant speaker is currently not visible.
    if (dominantSpeaker !== local?.id && !visibleRemoteParticipants.has(dominantSpeaker)) {
        updateRemoteParticipants(store);
    }
}
