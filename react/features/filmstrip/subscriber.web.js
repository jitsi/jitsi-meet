// @flow

import Filmstrip from '../../../modules/UI/videolayout/Filmstrip';
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import { StateListenerRegistry } from '../base/redux';
import { getCurrentLayout, shouldDisplayTileView, LAYOUTS } from '../video-layout';

import { setHorizontalViewDimensions, setTileViewDimensions } from './actions.web';

/**
 * Listens for changes in the number of participants to calculate the dimensions of the tile view grid and the tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].length,
    /* listener */ (numberOfParticipants, store) => {
        const state = store.getState();

        if (shouldDisplayTileView(state)) {
            store.dispatch(
                setTileViewDimensions(state)
            );
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
            store.dispatch(
                setTileViewDimensions(state)
            );
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

/**
 * Listens for changes in the chat state to calculate the dimensions of the tile view grid and the tiles.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/chat'].isOpen,
    /* listener */ (isChatOpen, store) => {
        const state = store.getState();

        if (isChatOpen) {
            // $FlowFixMe
            document.body.classList.add('shift-right');
        } else {
            // $FlowFixMe
            document.body.classList.remove('shift-right');
        }

        if (shouldDisplayTileView(state)) {
            store.dispatch(
                setTileViewDimensions(state)
            );
        }
    });
