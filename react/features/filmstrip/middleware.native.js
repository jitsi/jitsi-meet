import { MiddlewareRegistry } from '../base/redux';
import { CLIENT_RESIZED, SET_ASPECT_RATIO } from '../base/responsive-ui/actionTypes';

import { setTileViewDimensions } from './actions';
import './subscriber';

/**
 * Middleware that handles widnow dimension changes and updates the aspect ratio.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CLIENT_RESIZED:
    case SET_ASPECT_RATIO:
        dispatch(setTileViewDimensions());
        break;
    }

    return result;
});
