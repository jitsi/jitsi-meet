// @flow

import Filmstrip from '../../../modules/UI/videolayout/Filmstrip';
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import { StateListenerRegistry, equals } from '../base/redux';
import { setFilmstripVisible } from '../filmstrip/actions';
import { setOverflowDrawer } from '../toolbox/actions.web';
import { getCurrentLayout, getTileViewGridDimensions, shouldDisplayTileView, LAYOUTS } from '../video-layout';

import { setHorizontalViewDimensions, setTileViewDimensions } from './actions.web';
import {
    ASPECT_RATIO_BREAKPOINT,
    DISPLAY_DRAWER_THRESHOLD,
    SINGLE_COLUMN_BREAKPOINT,
    TWO_COLUMN_BREAKPOINT
} from './constants';

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

            if (!equals(gridDimensions, oldGridDimensions)) {
                const { clientHeight, clientWidth } = state['features/base/responsive-ui'];

                store.dispatch(
                    setTileViewDimensions(
                        gridDimensions,
                        {
                            clientHeight,
                            clientWidth
                        },
                        store
                    )
                );
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

            store.dispatch(
                setTileViewDimensions(
                    getTileViewGridDimensions(state),
                    {
                        clientHeight,
                        clientWidth
                    },
                    store
                )
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
            const gridDimensions = getTileViewGridDimensions(state);
            const { clientHeight, clientWidth } = state['features/base/responsive-ui'];

            store.dispatch(
                setTileViewDimensions(
                    gridDimensions,
                    {
                        clientHeight,
                        clientWidth
                    },
                    store
                )
            );
        }
    });

/**
 * Listens for changes in the client width to determine whether the overflow menu(s) should be displayed as drawers.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/responsive-ui'].clientWidth < DISPLAY_DRAWER_THRESHOLD,
    /* listener */ (widthBelowThreshold, store) => {
        store.dispatch(setOverflowDrawer(widthBelowThreshold));
    });

/**
 * Gracefully hide/show the filmstrip when going past threshold.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/responsive-ui'].clientWidth < ASPECT_RATIO_BREAKPOINT,
    /* listener */ (widthBelowThreshold, store) => {
        store.dispatch(setFilmstripVisible(!widthBelowThreshold));
    });

/**
 * Symbol mapping used for the tile view responsiveness computation.
 */
const responsiveColumnMapping = {
    singleColumn: Symbol('singleColumn'),
    twoColumns: Symbol('twoColumns'),
    twoParticipantsSingleColumn: Symbol('twoParticipantsSingleColumn')
};

/**
 * Listens for changes in the screen size to recompute
 * the dimensions of the tile view grid and the tiles for responsiveness.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const { clientWidth } = state['features/base/responsive-ui'];

        if (clientWidth < TWO_COLUMN_BREAKPOINT && clientWidth >= ASPECT_RATIO_BREAKPOINT) {
            // Forcing the recomputation of tiles when screen switches in or out of
            // the (TWO_COLUMN_BREAKPOINT, ASPECT_RATIO_BREAKPOINT] interval.
            return responsiveColumnMapping.twoColumns;
        } else if (clientWidth < ASPECT_RATIO_BREAKPOINT && clientWidth >= SINGLE_COLUMN_BREAKPOINT) {
            // Forcing the recomputation of tiles when screen switches in or out of
            // the (ASPECT_RATIO_BREAKPOINT, SINGLE_COLUMN_BREAKPOINT] interval.
            return responsiveColumnMapping.twoParticipantsSingleColumn;
        }

        /**
         * This gets called either when the width of the screen is above {@code TWO_COLUMN_BREAKPOINT}
         * or below {@CODE SINGLE_COLUMN_BREAKPOINT}, however, the internal logic from {@code getMaxColumnCount}
         * only takes the second case into consideration.
         */
        return responsiveColumnMapping.singleColumn;
    },
    /* listener */ (_, store) => {
        const state = store.getState();

        if (shouldDisplayTileView(state)) {
            const gridDimensions = getTileViewGridDimensions(state);
            const { clientHeight, clientWidth } = state['features/base/responsive-ui'];

            store.dispatch(
                setTileViewDimensions(
                    gridDimensions,
                    {
                        clientHeight,
                        clientWidth
                    },
                    store
                )
            );
        }
    });
