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
 * We force updateRemoteParticipants to make sure it executes and for the case where
 * sortedRemoteVirtualScreenshareParticipants becomes 0. We do not want to short circuit it in case of no screen-sharers
 * and no scroll and triggered for dominant speaker changed.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].sortedRemoteVirtualScreenshareParticipants,
    /* listener */ (sortedRemoteVirtualScreenshareParticipants, store) => updateRemoteParticipants(store, true));

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
