import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { isFilmstripScrollVisible, updateRemoteParticipants } from './functions';

/**
 * Listens for changes to the screensharing status of the remote participants to recompute the reordered list of the
 * remote endpoints.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-layout'].remoteScreenShares,
    /* listener */ (remoteScreenShares, store) => updateRemoteParticipants(store));

/**
 * Listens for changes to the remote screenshare participants to recompute the reordered list of the remote endpoints.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].sortedRemoteVirtualScreenshareParticipants,
    /* listener */ (sortedRemoteVirtualScreenshareParticipants, store) => updateRemoteParticipants(store));

/**
 * Listens for changes to the dominant speaker to recompute the reordered list of the remote endpoints.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].dominantSpeaker,
    /* listener */ (dominantSpeaker, store) => updateRemoteParticipants(store));

/**
 * Listens for changes in the filmstrip scroll visibility.
 */
StateListenerRegistry.register(
    /* selector */ state => isFilmstripScrollVisible(state),
    /* listener */ (_, store) => updateRemoteParticipants(store));
