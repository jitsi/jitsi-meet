// @flow

import { StateListenerRegistry } from '../base/redux';

import { setVisibleRemoteParticipants } from './actions.any';
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
 * Additionally, it handles the visibility of the dominant speaker in the reducedUI mode.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].dominantSpeaker,
    /* listener */ (dominantSpeaker, store) => {
        const { reducedUI } = store.getState()['features/base/responsive-ui'];

        updateRemoteParticipants(store);
        _makeAllParticipantsVisible(store, reducedUI);
    });

/**
 * Listens for changes to the reducedUI to update the dominant speaker's visibility.
 *  */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/responsive-ui'].reducedUI,
    /* listener */ (reducedUI, store) => _makeAllParticipantsVisible(store, reducedUI));

/**
 * Helper function to expand the visible range to cover all of the participants when ReducedUI is true.
 *
 * Note, since lastN becomes 1 in the reducedUI mode, only one video stream will be received.
 *
 * @param {Store} store - The redux store.
 * @param {boolean} reducedUI - The current reducedUI mode.
 * @returns {void}
 */
function _makeAllParticipantsVisible(store, reducedUI) {
    if (reducedUI) {
        const { remoteParticipants } = store.getState()['features/filmstrip'];

        store.dispatch(setVisibleRemoteParticipants(0, remoteParticipants.length - 1));
    }
}
