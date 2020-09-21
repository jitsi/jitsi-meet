// @flow

import Filmstrip from '../../../modules/UI/videolayout/Filmstrip';
import { MiddlewareRegistry } from '../base/redux';
import { CLIENT_RESIZED } from '../base/responsive-ui';
import {
    getCurrentLayout,
    LAYOUTS,
    shouldDisplayTileView
} from '../video-layout';

import { SET_HORIZONTAL_VIEW_DIMENSIONS, SET_TILE_VIEW_DIMENSIONS } from './actionTypes';
import { setHorizontalViewDimensions, setTileViewDimensions } from './actions.web';

import './subscriber.web';

/**
 * The middleware of the feature Filmstrip.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CLIENT_RESIZED: {
        const state = store.getState();
        const layout = getCurrentLayout(state);

        switch (layout) {
        case LAYOUTS.TILE_VIEW: {
            const { gridDimensions } = state['features/filmstrip'].tileViewDimensions;
            const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
            const { isOpen } = state['features/chat'];

            store.dispatch(
                setTileViewDimensions(
                    gridDimensions,
                    {
                        clientHeight,
                        clientWidth
                    },
                    isOpen
                )
            );
            break;
        }
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
            store.dispatch(setHorizontalViewDimensions(state['features/base/responsive-ui'].clientHeight));
            break;
        }
        break;
    }
    case SET_TILE_VIEW_DIMENSIONS: {
        const state = store.getState();

        if (shouldDisplayTileView(state)) {
            const { width, height } = state['features/filmstrip'].tileViewDimensions.thumbnailSize;

            // Once the thumbnails are reactified this should be moved there too.
            Filmstrip.resizeThumbnailsForTileView(width, height, true);
        }
        break;
    }
    case SET_HORIZONTAL_VIEW_DIMENSIONS: {
        const state = store.getState();

        if (getCurrentLayout(state) === LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW) {
            const { horizontalViewDimensions = {} } = state['features/filmstrip'];

            // Once the thumbnails are reactified this should be moved there too.
            Filmstrip.resizeThumbnailsForHorizontalView(horizontalViewDimensions, true);
        }

        break;
    }
    }

    return result;
});

