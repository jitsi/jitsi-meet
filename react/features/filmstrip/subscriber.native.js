// @flow

import { getParticipantCountWithFake } from '../base/participants';
import { StateListenerRegistry } from '../base/redux';
import { shouldDisplayTileView } from '../video-layout';

import { setTileViewDimensions } from './actions';
import './subscriber.any';

/**
 * Listens for changes in the number of participants to calculate the dimensions of the tile view grid and the tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const participantCount = getParticipantCountWithFake(state);

        if (participantCount < 6) { // the dimensions are updated only when the participant count is lower than 6.
            return participantCount;
        }

        return 5; // make sure we don't update the dimensions.
    },
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
