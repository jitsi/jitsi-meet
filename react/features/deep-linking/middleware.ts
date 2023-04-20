import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { OPEN_DESKTOP_APP } from './actionTypes';
import { openDesktopApp } from './functions';

/**
 * Implements the middleware of the deep linking feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case OPEN_DESKTOP_APP:
        openDesktopApp(store.getState());
        break;
    }

    return next(action);
});
