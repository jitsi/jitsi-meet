// @flow

import { StateListenerRegistry, equals } from '../base/redux';
import Filmstrip from '../../../modules/UI/videolayout/Filmstrip';
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
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
            const gridDimensions = getTileViewGridDimensions(state);
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
    /* selector */ state => getCurrentLayout(state),
    /* listener */ (layout, store) => {
        const state = store.getState();

        switch (layout) {
        case LAYOUTS.TILE_VIEW: {
            const { clientHeight, clientWidth } = state['features/base/responsive-ui'];

            store.dispatch(setTileViewDimensions(
                getTileViewGridDimensions(state), {
                    clientHeight,
                    clientWidth
                }));
            break;
        }
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
            store.dispatch(setHorizontalViewDimensions(state['features/base/responsive-ui'].clientHeight));
            break;
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            // Once the thumbnails are reactified this should be moved there too.
            Filmstrip.resizeThumbnailsForVerticalView();
            break;
        }
    });

/**
 * Handles on stage participant updates.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/large-video'].participantId,
    /* listener */ (participantId, store, oldParticipantId) => {
        const newThumbnail = VideoLayout.getSmallVideo(participantId);
        const oldThumbnail = VideoLayout.getSmallVideo(oldParticipantId);

        if (newThumbnail) {
            newThumbnail.updateView();
        }

        if (oldThumbnail) {
            oldThumbnail.updateView();
        }
    }
);
