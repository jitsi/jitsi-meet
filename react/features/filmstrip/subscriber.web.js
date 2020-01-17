// @flow

import { StateListenerRegistry, equals } from '../base/redux';
import { getCurrentLayout, getTileViewGridDimensions, shouldDisplayTileView, LAYOUTS } from '../video-layout';

import { setHorizontalViewDimensions, setTileViewDimensions } from './actions';

/**
 * Listens for changes in the number of participants to calculate the dimensions of the tile view grid and the tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].length,
    /* listener */ (numberOfParticipants, store) => {
        const state = store.getState();

        if (shouldDisplayTileView(state)) {
            const gridDimensions = getTileViewGridDimensions(state['features/base/participants'].length);
            const oldGridDimensions = state['features/filmstrip'].tileViewDimensions.gridDimensions;
            const { clientHeight, clientWidth } = state['features/base/responsive-ui'];

            if (!equals(gridDimensions, oldGridDimensions)) {
                store.dispatch(setTileViewDimensions(gridDimensions, {
                    clientHeight,
                    clientWidth
                }));
            }
        }
    });

/**
 * Listens for changes in the selected layout to calculate the dimensions of the tile view grid and horizontal view.
 */
StateListenerRegistry.register(
    /* selector */ state => shouldDisplayTileView(state),
    /* listener */ (displayTileView, store) => {
        const state = store.getState();
        const layout = getCurrentLayout(state);

        switch (layout) {
        case LAYOUTS.TILE_VIEW: {
            const { clientHeight, clientWidth } = state['features/base/responsive-ui'];

            store.dispatch(setTileViewDimensions(
                getTileViewGridDimensions(state['features/base/participants'].length), {
                    clientHeight,
                    clientWidth
                }));
            break;
        }
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
            store.dispatch(setHorizontalViewDimensions(state['features/base/responsive-ui'].clientHeight));
            break;
        }
    });
