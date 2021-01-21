// @flow

import { MiddlewareRegistry } from '../base/redux';
import { CLIENT_RESIZED } from '../base/responsive-ui';
import {
    getCurrentLayout,
    LAYOUTS
} from '../video-layout';

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
    }

    return result;
});

