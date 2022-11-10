import { getCurrentConference } from '../base/conference/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { shouldDisplayTileView } from '../video-layout/functions.native';

import { setRemoteParticipants, setTileViewDimensions } from './actions.native';
import { getTileViewParticipantCount } from './functions.native';
import './subscriber.any';

/**
 * Listens for changes in the number of participants to calculate the dimensions of the tile view grid and the tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => getTileViewParticipantCount(state),
    /* listener */ (_, store) => {
        const state = store.getState();

        if (shouldDisplayTileView(state)) {
            store.dispatch(setTileViewDimensions());
        }
    });

/**
 * Listens for changes in the selected layout to calculate the dimensions of the tile view grid and horizontal view.
 */
StateListenerRegistry.register(
    /* selector */ state => shouldDisplayTileView(state),
    /* listener */ (isTileView, store) => {
        if (isTileView) {
            store.dispatch(setTileViewDimensions());
        }
    });

/**
 * Listens for changes in the current conference and clears remote participants from this feature.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference) => {
        if (conference !== previousConference) {
            dispatch(setRemoteParticipants([]));
        }
    });
